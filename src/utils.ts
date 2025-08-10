import { MongoClient, Db, Collection } from "mongodb";


export const getFlashcardCollection = async () => {
    const mongoUri: string = process.env.CONNECTION_STRING || "";
    if (!mongoUri) {
    console.error("Missing MongoDB connection string in .env");
    process.exit(1);
    }
    const client = new MongoClient(mongoUri);
    try {
        await client.connect();
        const db: Db = client.db("FlashcardApp");
        const flashCardCollection: Collection = db.collection("Flashcards");
        console.log("Connected to DB, inserting flashcard...");
        return flashCardCollection
    }
    catch (error: any) {
        console.log(error)
        return error
    }   
}