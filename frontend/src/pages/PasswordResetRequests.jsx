import AdminNavbar from "../components/AdminNavbar";
import { Container, Typography } from "@mui/material";

const PasswordResetRequests = () => {
  return (
    <>
      <AdminNavbar />
      <Container sx={{ mt: 4 }}>
        <Typography variant="h4">
          Password Reset Requests
        </Typography>

        <Typography sx={{ mt: 2 }}>
          (To be implemented with reset workflow)
        </Typography>
      </Container>
    </>
  );
};

export default PasswordResetRequests;
