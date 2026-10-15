function Login() {

    return (
        <div className="login-page">

            <div className="login-card">

                <div className="login-logo">
                    CV
                </div>

                <h1>
                    CoalVision
                </h1>

                <p>
                    Multimodal Coal Transportation Visibility
                </p>

                <div className="login-field">

                    <label>
                        Username
                    </label>

                    <input
                        type="text"
                        placeholder="Enter username"
                    />

                </div>

                <div className="login-field">

                    <label>
                        Password
                    </label>

                    <input
                        type="password"
                        placeholder="Enter password"
                    />

                </div>

                <button className="login-button">
                    Sign In
                </button>

                <span className="login-footer">
                    Secure JWT authentication
                </span>

            </div>

        </div>
    );
}

export default Login;