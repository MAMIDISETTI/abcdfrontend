import React, { useContext } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { UserContext } from '../context/userContext'

const PrivateRoute = ({ allowedRoles }) => {
  const context = useContext(UserContext)

  // Handle case where context might be undefined
  if (!context) {
    return <div>Loading...</div>
  }

  const { user, loading } = context

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <Navigate to="/login" />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" />
  }

  return <Outlet />
}

export default PrivateRoute