import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import './App.css'
import Login from './Pages/Login'; 

function App() {
  const [count, setCount] = useState(0)
  return (
    <>
      <Login></Login>
      <Register></Register>
    </>
  )
}

export default App
