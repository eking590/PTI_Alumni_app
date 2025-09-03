import mongoose from "mongoose"; 
import { config } from "dotenv";

config() 

const Mongoose = process.env.MONGO_URI || "mongodb+srv://ogehebor:wsWhMDGJUQthQlxP@cloud9.vgm2e.mongodb.net/?retryWrites=true&w=majority&appName=cloud9"; 

export const db = mongoose.connect(Mongoose, { })
.then(() => console.log('Connected to PTI Alumni database...')) 

.catch(err => console.log('Could not connect to PTI Alumni database...'))


