import { Link, useNavigate } from "react-router-dom"
import "./login.scss"
import { useContext, useState } from "react"
import apiRequest from "../../lib/apiRequest"
import { AuthContext } from "../../context/AuthContext"

function Login() {

    const [error,setError] = useState("")
    const [isLoading,setisLoading] = useState(false)

    const {updateUser} = useContext(AuthContext)

    const navigate = useNavigate()

    const handleSubmit = async (e) => {

        e.preventDefault();                 

        setisLoading(true)
        setError("")

        const formData = new FormData(e.target);

        const email = formData.get("email");
        const password = formData.get("password");

        try{
            const res = await apiRequest.post("/auth/login",{
                email,
                password,
            })

            updateUser(res.data);

            navigate("/")
        }catch (err) {
            setError(err.response.data.message);
        }finally{
            setisLoading(false)
        }
    }

    return(
        <div className="login">
            <div className="visualPanel">
                <div className="visualInner">
                    <p className="tag">Trusted Real Estate Network</p>
                    <h2>Find premium homes with clarity and confidence.</h2>
                    <p className="description">
                        Access moderated listings, real-time chat, and verified property details in one place.
                    </p>
                    <div className="visualStats">
                        <div>
                            <strong>24K+</strong>
                            <span>Monthly Visitors</span>
                        </div>
                        <div>
                            <strong>8.7K</strong>
                            <span>Verified Listings</span>
                        </div>
                        <div>
                            <strong>4.9/5</strong>
                            <span>Customer Trust</span>
                        </div>
                    </div>
                    <div className="imageFrame">
                        <img src="/bg.png" alt="Modern residential property" />
                    </div>
                </div>
            </div>

            <div className="formContainer">
                <div className="formCard">
                    <p className="eyebrow">Welcome Back</p>
                    <h1>Sign In</h1>
                    <p className="subtitle">Continue to your account and manage properties with ease.</p>

                    <form onSubmit={handleSubmit}>
                        <input type="email" name="email" placeholder="Email" minLength={13} maxLength={25} required/>
                        <input type="password" name="password" placeholder="Password" required/>
                        <button disabled={isLoading}>{isLoading ? "Signing in..." : "Login"}</button>
                        {error && <span>{error}</span>}
                        <Link to={"/register"}>Don&apos;t have an account? Create one</Link>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default Login