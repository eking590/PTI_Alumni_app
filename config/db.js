import mongoose from "mongoose"; 
import { config } from "dotenv";

config() 

const Mongoose = process.env.MONGO_URL; 

export const db = mongoose.connect(Mongoose, { })
.then(() => console.log('Connected to PTI Alumni database...')) 
.catch(err => console.log('Could not connect to PTI Alumni database...'))