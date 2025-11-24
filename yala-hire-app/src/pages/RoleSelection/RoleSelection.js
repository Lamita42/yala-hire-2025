import { Link } from "react-router-dom";

export default function RoleSelection() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>What would you like to do?</h1>

      <div style={styles.buttonGroup}>
        <Link to="/choose-seeker-type">
          <button style={styles.btn}>I am looking for a job</button>
        </Link>

        <Link to="/register?role=company">
          <button style={{ ...styles.btn, background: "#007bff" }}>
            I am hiring
          </button>
        </Link>
      </div>
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    marginTop: "100px",
  },
  title: {
    fontSize: "28px",
    marginBottom: "40px",
  },
  buttonGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    alignItems: "center",
  },
  btn: {
    padding: "14px 30px",
    fontSize: "18px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    background: "#333",
    color: "white",
    width: "250px",
  },
};
