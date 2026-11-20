import { isFirebaseConfigured } from "../../config/firebase.js";
import { observeAuth, signInWithGoogle, signOutUser } from "../../services/auth.service.js";

const root = document.getElementById("auth-widget");
if (root) {
  const status = document.createElement("span");
  status.style.cssText = "font-size:12px;flex:1;min-width:140px";
  status.setAttribute("aria-live", "polite");
  const button = document.createElement("button");
  button.className = "primary";
  button.type = "button";
  root.append(status, button);

  if (!isFirebaseConfigured) {
    status.textContent = "Chế độ demo: chưa kết nối Firebase";
    button.textContent = "Đăng nhập Google";
    button.disabled = true;
    button.title = "Cần cấu hình Firebase trước khi đăng nhập";
  } else {
    status.textContent = "Đang kiểm tra đăng nhập…";
    button.disabled = true;
    observeAuth(user => {
      status.textContent = user
        ? `Đăng nhập: ${user.displayName || user.email || "Thành viên"}`
        : "Chưa đăng nhập";
      button.textContent = user ? "Đăng xuất" : "Đăng nhập Google";
      button.disabled = false;
      button.onclick = async () => {
        button.disabled = true;
        try {
          if (user) await signOutUser();
          else await signInWithGoogle();
        } catch (error) {
          console.error("Firebase Auth error", error);
          const messages = {
            "auth/popup-closed-by-user": "Bạn đã đóng cửa sổ đăng nhập.",
            "auth/unauthorized-domain": "Tên miền chưa được thêm vào Firebase Authorized domains.",
            "auth/operation-not-allowed": "Hãy bật Google trong Firebase Sign-in method."
          };
          status.textContent = messages[error.code] || "Đăng nhập thất bại. Hãy kiểm tra cấu hình Firebase.";
          button.disabled = false;
        }
      };
    });
  }
}
