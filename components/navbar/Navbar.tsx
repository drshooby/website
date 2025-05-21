"use client";

import styles from "./Navbar.module.css"
import React, { useState } from 'react';

export default function Navbar() {
    const [currTab, setTab] = useState("About");

    const renderContent = () => {
        switch (currTab) {
            case "About":
                return <div>About me content goes here!</div>;
            case "Portfolio":
                return <div>My cool portfolio stuff goes here!</div>;
            case "Contact":
                return <div>Here's how to contact me!</div>;
            default:
                return <div>404 Tab not found</div>;
        }
    };

    return (
        <>
            <div className={styles.navContainer}>
                <ul className={styles.navList}>
                    <li 
                        className={currTab === "About" ? styles.active : ""} 
                        onClick={() => setTab("About")}
                    >
                        About
                    </li>
                    <li 
                        className={currTab === "Portfolio" ? styles.active : ""} 
                        onClick={() => setTab("Portfolio")}
                    >
                        Portfolio
                    </li>
                    <li 
                        className={currTab === "Contact" ? styles.active : ""} 
                        onClick={() => setTab("Contact")}
                    >
                        Contact
                    </li>
                </ul>
            </div>

            <div className={styles.contentArea}>
                {renderContent()}
            </div>
        </>
    );
}