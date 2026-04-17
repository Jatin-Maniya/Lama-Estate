import "./layout.scss"

import Navbar from "../../components/navbar/Navbar"
import { Navigate, Outlet } from "react-router-dom"
import { useContext, useEffect, useState } from "react"
import { AuthContext } from "../../context/AuthContext"
import apiRequest from "../../lib/apiRequest"

function Layout() {
    return(
        <div className="layout">
                <div className="navbar">
                    <Navbar/>
                </div>
                <div className="content">
                    <Outlet/>
                </div>
        </div>
    )
}

function RequireAuth() {

    const {currentUser} = useContext(AuthContext)

    return(
        !currentUser ? <Navigate to="/login"/> : (
            <div className="layout">
                    <div className="navbar">
                        <Navbar/>
                    </div>
                    <div className="content">
                        <Outlet/>
                    </div>
            </div>
        )
    )
}

function RequireAdmin() {
    const { currentUser } = useContext(AuthContext)
    const [isChecking, setIsChecking] = useState(true)
    const [canAccess, setCanAccess] = useState(false)

    useEffect(() => {
        const checkAdminAccess = async () => {
            if (!currentUser || !currentUser.isAdmin) {
                setCanAccess(false)
                setIsChecking(false)
                return
            }

            try {
                await apiRequest.get("/admin/dashboard")
                setCanAccess(true)
            } catch (error) {
                setCanAccess(false)
            } finally {
                setIsChecking(false)
            }
        }

        checkAdminAccess()
    }, [currentUser])

    if (!currentUser) {
        return <Navigate to="/login" />
    }

    if (!currentUser.isAdmin) {
        return <Navigate to="/" />
    }

    if (isChecking) {
        return (
            <div className="layout">
                <div className="navbar">
                    <Navbar/>
                </div>
                <div className="content">Checking admin access...</div>
            </div>
        )
    }

    if (!canAccess) {
        return <Navigate to="/" />
    }

    return (
        <div className="layout">
            <div className="navbar">
                <Navbar/>
            </div>
            <div className="content">
                <Outlet/>
            </div>
        </div>
    )
}



export {Layout,RequireAuth,RequireAdmin}