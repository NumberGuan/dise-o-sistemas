import "./loading-screen.css";

type Props = {
  message: string;
  fullScreen?: boolean;
};

export default function LoadingScreen({ message, fullScreen = false }: Props) {
  return (
    <div className={fullScreen ? "pasta-loading pasta-loading--screen" : "pasta-loading"} role="status">
      <div className="pasta-loading__panel">
        <div className="pasta-loading__badge" aria-hidden="true">
          <img src="/logo-pasta.png" width="112" height="112" alt="" />
        </div>
        <p>{message}</p>
        <div className="pasta-loading__track" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
