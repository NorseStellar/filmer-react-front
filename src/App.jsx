import React from "react";
import "./App.css";
import { useEffect, useState } from "react";
import MovieCard from "./components/MovieCard";

const API_URL = import.meta.env.VITE_API_URL;

function App() {
   const [filmer, setFilmer] = useState([]);
   const [titel, setTitel] = useState("");
   const [regissor, setRegissor] = useState("");
   const [ar, setAr] = useState("");
   const [skadespelare, setSkadespelare] = useState("");
   const [rating, setRating] = useState("");
   const [status, setStatus] = useState("Laddar filmer...");

   const fetchFilmer = async () => {
      try {
         const res = await fetch(API_URL);
         const data = await res.json();
         setFilmer(data);
         setStatus("");
      } catch (err) {
         console.error(err);
         setStatus("Kunde inte hämta filmer.");
      }
   };

   useEffect(() => {
      fetchFilmer();
   }, []);

   // Lyssna på offline POST/DELETE sync från service-workern.
   useEffect(() => {
      if ("serviceWorker" in navigator) {
         navigator.serviceWorker.addEventListener("message", (event) => {
            if (event.data === "offline-saved") {
               setStatus("Offline sparad och synkas senare!");
            }

            if (event.data === "synced") {
               setStatus("Offline är synkad med servern!");
               fetchFilmer(); // Hämta uppdaterad lista efter sync.
            }
         });
      }
   }, []);

   // Start addFilm. ***
   const addFilm = async (e) => {
      e.preventDefault();

      try {
         await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ titel, regissor, ar, skadespelare, rating }),
         });

         fetchFilmer(); // Endast om online.
      } catch (err) {
         console.log("Offline – sparar via service worker");
      }

      setTitel("");
      setRegissor("");
      setAr("");
      setSkadespelare("");
      setRating("");
   };
   // End addFilm. ***

   // Start deleteFilm. ***
   const deleteFilm = async (id) => {
      try {
         await fetch(`${API_URL}/${id}`, { method: "DELETE" });

         fetchFilmer(); // Endast om online.
      } catch (err) {
         console.log("Offline delete, sparas via service worker");
      }
   };
   // End deleteFilm. ***

   return (
      <main>
         <h1>Filmfavoriter</h1>
         <form onSubmit={addFilm} className="film-form">
            <input placeholder="Titel" value={titel} onChange={(e) => setTitel(e.target.value)} />
            <input placeholder="Regissör" value={regissor} onChange={(e) => setRegissor(e.target.value)} />
            <input placeholder="År" value={ar} onChange={(e) => setAr(e.target.value)} />
            <input placeholder="Skådespelare" value={skadespelare} onChange={(e) => setSkadespelare(e.target.value)} />
            <input placeholder="Rating" value={rating} onChange={(e) => setRating(e.target.value)} />
            <button>Lägg till film</button>
         </form>

         {status && <p>{status}</p>}

         <div className="card-container">
            {filmer.map((film) => (
               <MovieCard key={film._id} film={film} onDelete={deleteFilm} />
            ))}
         </div>
      </main>
   );
}

export default App;
