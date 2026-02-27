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
   const [skadespealre, setSkadespealre] = useState("");
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
               setStatus("Sparad offline och synkas senare");
            }

            if (event.data === "synced") {
               setStatus("Offline-ändringar är synkade!");
               fetchFilmer(); // Hämta uppdaterad lista efter sync.
            }
         });
      }
   }, []);

   const addFilm = async (e) => {
      e.preventDefault();
      await fetch(API_URL, {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ titel, regissor, ar, skadespealre, rating }),
      });
      setTitel("");
      setRegissor("");
      setAr("");
      setSkadespealre("");
      setRating("");
      fetchFilmer();
   };

   const deleteFilm = async (id) => {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      fetchFilmer();
   };

   return (
      <main>
         <h1>Filmfavoriter</h1>
         <form onSubmit={addFilm} className="film-form">
            <input placeholder="Titel" value={titel} onChange={(e) => setTitel(e.target.value)} />
            <input placeholder="Regissör" value={regissor} onChange={(e) => setRegissor(e.target.value)} />
            <input placeholder="År" value={ar} onChange={(e) => setAr(e.target.value)} />
            <input placeholder="Skådespelare" value={skadespealre} onChange={(e) => setSkadespealre(e.target.value)} />
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
