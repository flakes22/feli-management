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

### 1. Personalized Recommendations System (Algorithmic Feed)
**Description:** The application features a dynamic feed that heavily prioritizes matching user interests against event and club attributes. Instead of basic filtering, the system acts as a personalized recommendation engine. 
**Justification & Design Choices:**
- Participants who sign up can declare multi-select interests. A scoring algorithm parses out text from an event's tags, description, name, and the organizer's category and aggregates points matching the user's declared interests.
- This creates an immersive, personalized dashboard, encouraging user engagement.
- Technical decision: The scoring logic is implemented entirely at the backend layer `getInterestScore` mapping. This ensures ranking integrity and offloads processing from client devices, allowing the server to sort and paginate the response effectively.

### 2. Custom Dynamic Form Builder for Event Registrations
**Description:** Organizers are no longer confined to static registration schemas. They can create dynamic sub-forms per event, specifying different field types (Dropdown, Required, Textbox, Checkboxes).
**Justification & Design Choices:**
- Every event has different requirements. Non-technical events might need t-shirt sizes, while coding competitions might need GitHub URLs. Hardcoding these in the schema is a poor technical decision.
- Technical decision: We implemented a `customFormSchema` populated within the primary Event Schema via Mongoose. The frontend parses this schema and dynamically renders localized React Form components depending on the field's meta-properties, collecting responses effectively within a flexible MongoDB Document array.

### 3. Real-Time Socket Integrations
**Description:** Real-time updates delivered concurrently to clients using WebSockets.
**Justification & Design Choices:**
- Important for scenarios like registration limits nearing capacity or time-critical updates by Admins. Standard periodic HTTP polling places too much strain on the database.
- Technical decision: Integrated `socket.io`. Websockets significantly lower the network footprint and latency compared to standard REST pooling, ensuring robust real-time synchronization.

### 4. Automated Ticketing & QR Check-ins
**Description:** Upon registration, the backend automatically generates a virtual QR ticket and manages digital entry validation via webcam scanning at the frontend interface using `html5-qrcode`.
**Justification & Design Choices:**
- Decreases check-in friction by 90% during live event management.
- Technical decision: Instead of storing image binaries of QR codes to a database, we compute the base64 or link URLs functionally (`qrcode` module). We integrated `html5-qrcode` to interface directly with client hardware to scan these generated payloads, triggering an isolated check-in API request when successfully resolved. 

### 5. Bot Protection via Google ReCAPTCHA
**Description:** Ensures interactions originating from signup endpoints and login portals are generated by actual users.
**Justification & Design Choices:**
- Crucial for mitigating DDOS attacks, malicious DB flooding, or credential stuffing.
- Technical decision: A frontend implementation handles user-facing challenges, resolving a token that is transmitted down to the backend. The backend acts as the true arbiter, verifying this specific token against the secret ReCaptcha endpoint via TLS before evaluating the request.

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