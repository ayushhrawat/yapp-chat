import React from 'react';
import { useNavigate } from 'react-router-dom';
import './FAQPage.css';

const FAQPage = () => {
 const navigate = useNavigate();

 const faqs = [
    {
      question: "💬 What is Yapp?",
      answer: "Yapp is a fast, real-time web chat app where you can message friends, share media, and stay connected without delays."
    },
    {
      question: "⚡ Why is Yapp so fast?",
      answer: "Yapp uses real-time technology, so messages appear instantly. No refreshing, no waiting. Just type and send."
    },
    {
      question: "🔐 Are my chats private?",
      answer: "Yes. Your messages stay between you and the people you're chatting with. Your conversations are stored securely."
    },
    {
      question: "🖼 Can I send images or media?",
      answer: "Absolutely. Send images and supported media directly in chat and keep the conversation lively."
    },
    {
      question: "🌐 Can I use Yapp on different devices?",
      answer: "Yes. Log in from any device with a browser and your chats will be there."
    },
    {
      question: "📡 Messages not sending?",
      answer: "Check your internet connection first. If the issue continues, refresh the page or log out and back in."
    },
    {
      question: "👤 Can I change my profile info?",
      answer: "Yep. Head to Settings → Profile to update your name, avatar, or other details."
    },
    {
      question: "🧹 Can I delete messages?",
      answer: "Yes. You can remove messages from the chat depending on the available chat options."
    },
    {
      question: "🛠 Need help?",
      answer: "If something feels broken or confusing, reach out through the Support / Help section and we'll take a look."
    },
    {
      question: "🚀 Why the name\"Yapp\"?",
      answer: "Because great conversations start with a simple\"yap.\" Fast chats, quick laughs, endless talk."
    }
  ];

 return (
    <div className="faq-page">
      <div className="faq-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>
        <h1>Yapp – Frequently Asked Questions</h1>
      </div>

      <div className="faq-content">
        {faqs.map((faq, index) => (
          <div key={index} className="faq-item">
            <h3 className="faq-question">{faq.question}</h3>
            <p className="faq-answer">{faq.answer}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQPage;
