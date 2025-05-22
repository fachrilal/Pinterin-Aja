import React from "react";
import Navbar from "../components/Navbar";
import { Outlet } from "react-router-dom";

export default function Template() {
    return (
        <>
        <Navbar></Navbar>
        <div className="container">
            <Outlet></Outlet>
        </div>
        </>
    )
}