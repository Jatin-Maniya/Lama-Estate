import { Link, useNavigate } from "react-router-dom"
import "./register.scss"
import { useState } from "react"
import apiRequest from "../../lib/apiRequest"

function Register() {

    const [error,setError] = useState("")
    const [isLoading,setisLoading] = useState(false)

    const navigate = useNavigate()

    const handleSubmit = async (e) => {

        e.preventDefault();

        setisLoading(true)
        setError("")

        const formData = new FormData(e.target);

        const username = formData.get("username");
        const email = formData.get("email");
        const password = formData.get("password");

        try{
            const res = await apiRequest.post("/auth/register",{
                username,email,password     
            })
            navigate("/login")
        }catch(err) {
            setError(err.response.data.message)
        }
        finally{
            setisLoading(false)
        }

    }

    return (
        <div className="register">
            <div className="visualPanel">
                <div className="visualInner">
                    <p className="tag">Start Your Journey</p>
                    <h2>Create your account and publish properties faster.</h2>
                    <p className="description">
                        Join thousands of users finding, listing, and managing homes with an elegant modern workflow.
                    </p>
                    <div className="benefits">
                        <span>Verified Listings</span>
                        <span>Admin Moderation</span>
                        <span>Real-time Messaging</span>
                    </div>
                    <div className="imageFrame">
                        <img src="/bg.png" alt="Contemporary home exterior" />
                    </div>
                </div>
            </div>

            <div className="formContainer">
                <div className="formCard">
                    <p className="eyebrow">Create Account</p>
                    <h1>Register</h1>
                    <p className="subtitle">Set up your profile to discover and list properties in minutes.</p>

                    <form onSubmit={handleSubmit}>
                        <input type="text" name="username" placeholder="Username" required />
                        <input type="email" name="email" placeholder="Email" required />
                        <input type="password" name="password" placeholder="Password" required />
                        <button disabled={isLoading}>{isLoading ? "Creating account..." : "Register"}</button>
                        {error && <span>{error}</span>}
                        <Link to={"/login"}>Already have an account? Sign in</Link>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Register