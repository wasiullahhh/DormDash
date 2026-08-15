import { useState } from "react";
import "./LoginPage.css";
import { useSession } from "../../context/SessionContext";
import { ALLOWED_EMAIL_DOMAIN } from "../../lib/supabase";

export default function LoginPage({ onClose }) {
    const { registerUser, signInUser } = useSession();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const allowedDomain = `@${ALLOWED_EMAIL_DOMAIN}`;

    function validateEmailDomain(e) {
        return e.toLowerCase().endsWith(allowedDomain);
    }

    const handleSubmit = async (evt) => {
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

        setSubmitting(true);
        try {
            if (isCreating) {
                const nameFromEmail = email.split("@")[0].replace(/\.|_/g, " ");
                const res = await registerUser({
                    email,
                    password,
                    name: nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1),
                });
                if (!res.success) {
                    setError(res.error);
                    return;
                }
                if (onClose) onClose();
                return;
            }

            // Sign in flow: require prior registration
            const res = await signInUser({ email, password });
            if (!res.success) {
                setError(res.error);
                return;
            }
            if (onClose) onClose();
        } finally {
            setSubmitting(false);
        }
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
                        <button type="submit" className="btn-primary" disabled={submitting}>
                            {submitting ? "Please wait…" : isCreating ? "Create Account" : "Sign In"}
                        </button>
                        <button
                            type="button"
                            className="btn-secondary"
                            disabled={submitting}
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
