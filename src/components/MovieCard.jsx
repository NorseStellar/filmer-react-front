import React from "react";
export default function MovieCard({ film, onDelete }) {
   return (
      <div className="card">
         <h3>{film.titel}</h3>
         <p>Regissör: {film.regissor}</p>
         <p>År: {film.ar}</p>
         <p>Skådespelare: {film.skadespealre}</p>
         <p>Rating: {film.rating}</p>

         <button onClick={() => onDelete(film._id)}>Ta bort</button>
      </div>
   );
}
