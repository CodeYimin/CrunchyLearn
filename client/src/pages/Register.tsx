import { ReactElement, useState } from "react";

interface RegisterProps {}

export default function Register({}: RegisterProps): ReactElement {
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [status, setStatus] = useState<string>("");

  return (
    <div className="mt-[5rem] w-screen">
      <div className="mx-auto flex flex-col gap-5 w-[30rem]">
        <input
          className="input input-primary"
          value={username}
          onChange={(event) => setUsername(event.currentTarget.value)}
          placeholder="Username"
        />
        <input
          className="input input-primary"
          value={password}
          onChange={(event) => setPassword(event.currentTarget.value)}
          placeholder="Password"
        />
        <button
          className="btn btn-primary"
          onClick={() => {
            fetch("http://localhost:4445/register", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              credentials: "include",
              body: JSON.stringify({
                username,
                password,
              }),
            }).then((res) => {
              if (res.status === 200) {
                setStatus("Registration successful");
              } else {
                setStatus("Registration failed");
              }
            });
          }}
        >
          Register
        </button>
        <p className="mx-auto">{status}</p>
      </div>
    </div>
  );
}
