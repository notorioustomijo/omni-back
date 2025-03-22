import express from 'express';
import { ChatOpenAI } from '@langchain/openai';
import dotenv from 'dotenv';
import twilio from 'twilio';
import nodemailer from 'nodemailer';
import bodyParser from 'body-parser';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json())

const llm = new ChatOpenAI({
    model: 'gpt-3.5-turbo',
    apiKey: process.env.OPENAI_API_KEY
});


const accountSid = process.env.TWILIO_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;

const twilioClient = twilio(
    accountSid, authToken
);

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/api/message', async (req, res) => {
    const { channel, userId, message } = req.body;
    const reply = await llm.invoke(message);
    const text = reply.content;

    if (channel === 'whatsapp') {
        const message = await twilioClient.messages.create({
            body: text,
            from: 'whatsapp:+19379071099',
            to: userId,
        });

    } else if (channel === 'email') {
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: userId,
            subject: 'AI Response',
            text,
        });
    }

    res.json({ reply: text });
});

app.post('/api/whatsapp', async (req, res) => {
    const { Body, From } = req.body;
    const reply = await llm.invoke(Body);
    await twilioClient.messages.create({
        body: reply.content,
        from: 'whatsapp:+19379071099',
        to: From,
    });
    res.sendStatus(200);
});

app.listen(3000, () => console.log('Server running on port 3000'));