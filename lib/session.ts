export function getSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem("kl_session_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("kl_session_id", id);
  }
  return id;
}
