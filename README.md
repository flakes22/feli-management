# Felicity Event Management System

This is a comprehensive full-stack web application designed for managing events, clubs, and participants (Felicity Event Management System). It allows participants to discover events tailored to their interests, and organizers to seamlessly manage their events, custom registration forms, and attendees.

## Technology Stack & Libraries

### Frontend
- **React (`react`, `react-dom`)**: A popular UI library chosen for its component-based architecture, which makes building dynamic, interactive user interfaces efficient and scalable.
- **Vite (`vite`)**: Used as the build tool and development server due to its incredibly fast Hot Module Replacement (HMR) and optimized build processes compared to traditional tools like Create React App (Webpack).
- **Material-UI (`@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled`)**: A robust UI framework offering pre-built, accessible, and highly customizable React components. It accelerated development by providing responsive layouts and complex components (like Dialogs, DataGrids, and Chips) out-of-the-box.
- **React Router DOM (`react-router-dom`)**: The standard routing library for React, enabling seamless client-side navigation without page reloads, essential for a Single Page Application (SPA).
- **Axios (`axios`)**: A promise-based HTTP client for the browser. It was selected over the native `fetch` API for its automatic JSON data transformation, robust error handling, and ease of configuring interceptors (e.g., for attaching JWT tokens).
- **Socket.io Client (`socket.io-client`)**: Provides a bidirectional, event-based communication channel between the client and server. Used to power real-time updates and notifications across the application.
- **HTML5 QR Code (`html5-qrcode`)**: A lightweight and efficient library for scanning QR codes directly within a browser environment using a device's camera. Used for seamless check-in features without requiring an external mobile app.
- **React Google ReCAPTCHA (`react-google-recaptcha`)**: Integrates Google's ReCAPTCHA to protect authentication endpoints (signup, login) from automated bot abuse.

### Backend
- **Node.js & Express (`express`)**: A quick, minimalist web framework for Node.js, chosen for its excellent routing ecosystem and middleware support to build the RESTful API endpoints.
- **MongoDB & Mongoose (`mongoose`)**: A NoSQL database paired with an elegant Object Data Modeling (ODM) library. Its flexible schema design accommodates variations in data shapes, particularly for features like dynamical "Custom Registration Forms."
- **JSON Web Token (`jsonwebtoken`)**: Facilitates stateless API authentication. Instead of server-side sessions, user state is encoded in a JWT and sent with each request, which allows for horizontal scaling.
- **BcryptJS (`bcryptjs`)**: Used to securely hash user passwords before storing them in the database, protecting user credentials against data breaches.
- **Dotenv (`dotenv`)**: securely manages environment variables, ensuring sensitive keys (like DB URIs, SMTP credentials, and JWT secrets) remain isolated from the source code.
- **Multer (`multer`)**: Middleware for handling `multipart/form-data`, enabling the application to accept file uploads (e.g., event banners or profile pictures).
- **Socket.io (`socket.io`)**: The server counterpart for real-time bilateral communication, utilized to instantly broadcast updates to connected clients.
- **Nodemailer (`nodemailer`)**: A module for sending emails from Node.js. It performs critical automated tasks like dispatching registration confirmations, OTPs, or event tickets directly to users' inboxes.
- **QR Code (`qrcode`)**: A library deployed to generate QR codes containing registration identifiers on the backend, which are included in emails or fetched by the user as proof of registration.
- **Json2CSV (`json2csv`)**: Resolves the administrative requirement of exporting data. It allows Organizers and Admins to effortlessly convert participant lists and custom form responses into downloadable CSV spreadsheets.
- **Cors (`cors`)**: Middleware to enable Cross-Origin Resource Sharing, necessary to allow the frontend application to send requests to the backend API seamlessly across different local or deployed ports.

---

## Advanced Features Implemented

As per the requirements spanning Tier A, Tier B, and Tier C, the following 5 advanced features have been fully implemented into the system:

### 1. Merchandise Payment Approval Workflow (Tier A)
**Description:** Implement a payment verification system for merchandise purchases. Users upload a payment proof (image) after placing an order, entering a "Pending Approval" state. Organizers can view a separate tab with all orders showing uploaded payment proofs, approve/reject them, decrement stock, and automatically dispatch QR tickets upon approval.
**Justification & Design Choices:** 
- Ensures correct audit trailing and verification of manual payments before committing limited stock. It completely avoids the scenario of fake/unpaid orders monopolizing the merchandising inventory.
- **Technical decision:** We reused the core `Registration` schema and dynamically shifted states via `paymentProof` and `paymentStatus` properties. Heavy business logic (stock decrement, QR generation, grid-email dispatch) is decoupled from the participant purchase and isolated securely inside the organizer's approval mutation route, preventing any client-side tampering of inventory logic.

### 2. QR Scanner & Attendance Tracking (Tier A)
**Description:** Built-in QR Code scanner for organizers to validate tickets during events natively using a device camera, alongside attendance synchronization, duplicate scan rejections, and manual override tracking.
**Justification & Design Choices:** 
- Greatly accelerates event entry management on the ground and completely mitigates fraudulent or duplicate paper-ticket usage, bringing the platform up to the standards of modern ticketing apps.
- **Technical decision:** Implemented `html5-qrcode` on the React frontend to interface directly with the device's hardware camera. The QR data payload contains stringified JSON corresponding to the unique database ObjectIds, which are mapped cleanly by a dedicated backend attendance controller that enforces validation constraints before immutably stamping the `attendanceMarked` boolean flag.

### 3. Real-Time Discussion Forum (Tier B)
**Description:** Real-time discussion forum embedded on the Event Details page allowing registered participants to post messages and organizers to moderate, post announcements, and respond in real-time.
**Justification & Design Choices:** 
- Promotes high engagement and drastically cuts down on external chat groups (WhatsApp, Discord) becoming fractured or losing important context. It keeps event-specific communication tightly coupled to the actual event listing.
- **Technical decision:** Powered fundamentally by WebSockets using `Socket.io`. Standard HTTP periodic polling is deeply inefficient for chat; the bidirectional persistent socket channel ensures sub-second broadcast rendering for all connected users simultaneously without overwhelming the database with continuous read queries. MongoDB persists the chat history so late-joiners can hydrate the chat state.

### 4. Organizer Password Reset Workflow (Tier B)
**Description:** A complete password reset ecosystem for organizers. Organizers request a reset; Admin views requests via a central dashboard, adds notes, and approves/rejects them. Upon approval, the system auto-generates a secure new password for the Admin to share out-of-band.
**Justification & Design Choices:** 
- Provides an extremely robust, centralized administrative security workflow. By preventing organizers from executing arbitrary password resets unmonitored, it forces authentication oversight strictly back to the system Admin, mitigating internal hijacking during organizer handovers.
- **Technical decision:** Bypassed reliance on external SMTP/email-magic-link OTP flows by storing an embedded `passwordResetRequests` subdocument array natively inside the `Organizer` Mongoose model. Upon an Admin approval trigger (`updateOne` bypass to avoid strict validation errors), the backend issues a cryptographically secure random password utilizing Node's native `crypto` utility.

### 5. Bot Protection (Tier C)
**Description:** CAPTCHA verification strictly enforced on all public authentication routes (login and participant registration).
**Justification & Design Choices:** 
- An absolute necessity for any public-facing form. Crucial for mitigating DDoS payload attacks, malicious database flooding with fake accounts, and automated credential stuffing.
- **Technical decision:** Integrated `react-google-recaptcha`. The React frontend handles the localized user-facing visual challenge, generating a temporary token. Crucially, the Node backend acts as the true zero-trust arbiter, intercepting the auth controller pipeline to independently verify this specific token against Google's secret `siteverify` TLS endpoint before processing any data schemas.

## Database Architecture & Additional Attributes Justification

To facilitate our advanced features and properly abstract the intricate reality of event management, several significant additional attributes were incorporated into the MongoDB Mongoose Schemas beyond basic structural logic:

### Participant Schema
- **`participantType` (`Enum: IIIT, NON_IIIT`) & `collegeName`**: Essential for segregation logic. Internal users can be verified automatically (by regexing against `@students.iiit.ac.in`), whereas external participants can document their external institutional representation.
- **`interests` (`Array`)**: The linchpin for the *Algorithmic Feed*. It captures defined categories chosen by the user during onboarding which the backend cross-references to calculate match scores against specific events/clubs.
- **`followedOrganizers` (`Array of ObjectIds`)**: Enables the follower network. Instead of creating a whole interconnecting relationship collection, we embed this array functionally in the Participant schema to natively allow "Show Followed Club Events Only" mapping queries.

### Organizer Schema
- **`category`**: Defines the archetype of the club (e.g., Cultural, Technical). This is passed down onto their respective events, allowing for powerful macro-filtering via the participant dashboard.
- **`establishedYear`, `memberCount`, `socialMedia` (`Object`)**: Extended bio fields. Since Organizer profiles essentially act as "Club Pages," robust social mapping and historical attributes validate the organization to wandering participants browsing for domains.
- **`isActive` (`Boolean`)**: A critical administrative kill-switch. Rather than permanently deleting organizers (and thereby breaking referential integrity in existing registrations or past events), a toggle allows Admins to suspend organizers dynamically.

### Event Schema
- **`customForm` (`customFormSchema` embedded sub-document)**: Instead of locking events into monolithic, static schemas, or creating hundreds of isolated tables per event, the main event schema acts as a dynamically serialized definition of *other schemas*. It dictates field labels, formats (dropdown vs textarea), and requirements—significantly scaling the flexibility of event-hosting.
- **`type` (`Enum: NORMAL, MERCH`) & `variants/stock`**: By extending a normal ticketing event to encapsulate Merchandise sales (with variables like t-shirt sizes, multi-stock counts, and separate payment validations) inside the same model, we massively reduce infrastructure duplication.

### Registration Schema
- **`qrCode` & `ticketNumber` (`String`)**: Uniquely generated payload signatures assigned after registration processing. These act directly as virtual access passes physically scanned at checkpoints.
- **`attendanceMarked` (`Boolean`), `attendanceTime` (`Date`), `attendanceMarkedBy` (`ObjectId`)**: These temporal and boolean flags operate in synchronization with the QR endpoint. When a QR is scanned via device, the backend validates the token and immutably sets these, establishing the chain of custody for attendance on event day.
- **`paymentProof` & `paymentStatus` (`Enum: PENDING, APPROVED, REJECTED`)**: Required primarily for `MERCH` registration pathways, acting as a verifiable staging area where admins can validate manual transfers before formally activating the ticket block natively alongside regular free registrations.

---

## Setup and Installation Instructions

To run the full stack Felicity Event Management System locally, please follow the steps meticulously:

### Prerequisites:
Make sure you have installed on your system:
- Node.js (v18.x or above)
- npm or yarn package manager
- MongoDB (running locally, or a MongoDB Atlas connection string URI)

### 1. Clone the repository
Navigate into the root directory:
```bash
git clone <repository_url>
cd feli-management
```

### 2. Backend Setup
Navigate to the `backend` folder and install dependencies:
```bash
cd backend
npm install
```

Configure Environment Variables:
Create a `.env` file inside the `backend` directory (make sure it matches the variables the application expects):
```env
PORT=5001
MONGO_URI=mongodb://127.0.0.1:27017/feli_management
JWT_SECRET=your_super_secret_jwt_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

Start the Backend Server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal session, navigate to the `frontend` directory, and install its dependencies:
```bash
cd frontend
npm install
```

Configure Environment Variables:
Create a `.env` file inside the `frontend` directory:
```env
VITE_API_URL=http://localhost:5001/api
```

Start the Frontend Dev Server:
```bash
npm run dev
```

### 4. Access the Application
- Open your browser and navigate to the frontend URL locally, usually `http://localhost:5173`.
- The application should now have connectivity to the backend local server (on Port `5001`), and you are ready to use the app!