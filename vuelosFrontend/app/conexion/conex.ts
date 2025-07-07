import { FlightFormData } from "../types/types";

export default async function Conex(data:FlightFormData) {
    fetch('http://localhost:3010/api/receptora',{
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
    })
}