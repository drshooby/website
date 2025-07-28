import styles from "./Secret.module.css";

export function Secret({
  isSecretOpen,
  setSecretOpen,
}: {
  isSecretOpen: boolean;
  setSecretOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  return (
    <div>
      <h1>Welcome to the secret page!</h1>
      <button onClick={() => setSecretOpen(false)}>Click me to go back!</button>
    </div>
  );
}
