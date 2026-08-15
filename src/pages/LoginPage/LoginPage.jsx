import { useState } from "react";
import "./LoginPage.css";
import { useSession } from "../../context/SessionContext";

export default function LoginPage({ onClose }) {
    const { setUser, registerUser, signInUser } = useSession();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    const allowedDomain = "@my.centennialcollege.ca";

    function validateEmailDomain(e) {
        return e.toLowerCase().endsWith(allowedDomain);
    }

    const handleSubmit = (evt) => {
        evt.preventDefault();
        setError("");
        if (!email || !password) {
            setError("Please enter both email and password.");
            return;
        }

        // Enforce allowed domain for both sign-up and sign-in
        if (!validateEmailDomain(email)) {
            setError(
                `Only ${allowedDomain} student emails are allowed to sign in or create an account.`
            );
            return;
        }

        if (isCreating) {
            const nameFromEmail = email.split("@")[0].replace(/\.|_/g, " ");
            const res = registerUser({
                email,
                password,
                name: nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1),
            });
            if (!res.success) {
                setError(res.error);
                return;
            }
            setUser(res.user);
            if (onClose) onClose();
            return;
        }

        // Sign in flow: require prior registration
        const res = signInUser({ email, password });
        if (!res.success) {
            setError(res.error);
            return;
        }
        setUser(res.user);
        if (onClose) onClose();
    };

    return (
        <div className="login-overlay">
            <div className="login-card">
                {onClose && (
                    <button className="login-close" onClick={onClose}>
                        ×
                    </button>
                )}
                <h2 className="login-title">{isCreating ? "Create Account" : "Sign In"}</h2>

                <form className="login-form" onSubmit={handleSubmit}>
                    <label className="login-label">
                        Email
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </label>

                    <label className="login-label">
                        Password
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </label>

                    {error && <div className="login-error">{error}</div>}

                    <div className="login-actions">
                        <button type="submit" className="btn-primary">
                            {isCreating ? "Create Account" : "Sign In"}
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => setIsCreating((s) => !s)}
                        >
                            {isCreating ? "Have an account? Sign in" : "Create an account"}
                        </button>
                    </div>

                    <p className="login-note">
                        Accounts must use a {allowedDomain} email to create an account.
                    </p>
                </form>
            </div>
        </div>
    );
}
