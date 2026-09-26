import React, { useState } from 'react';

export function BusinessAssistant({ onAsk }) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [busy, setBusy] = useState(false);
  const ask = async value => {
    const prompt = String(value || question).trim();
    if (!prompt || busy) return;
    setQuestion(prompt);
    setBusy(true);
    try { const result = await onAsk(prompt); setAnswer(result.answer || 'I could not find an answer.'); }
    catch (error) { setAnswer(error.message || 'The business assistant is unavailable.'); }
    finally { setBusy(false); }
  };
  const listen = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) { setAnswer('Voice input is not available in this browser. Please type your question.'); return; }
    const recognition = new Recognition(); recognition.lang = 'en-IN'; recognition.interimResults = false;
    recognition.onresult = event => ask(event.results[0][0].transcript);
    recognition.onerror = () => setAnswer('I could not hear that. Please try again or type your question.');
    recognition.start();
  };
  return <section className="form-card business-assistant"><div className="section-heading"><div><small>YOUR BUSINESS ASSISTANT</small><h2>Ask Martisan</h2></div><span>✦</span></div><p>Ask about products, stock, sales, enquiries, or pricing.</p><div className="assistant-input"><input value={question} onChange={event=>setQuestion(event.target.value)} onKeyDown={event=>event.key==='Enter'&&ask()} placeholder="How many products do I have?" aria-label="Ask your business assistant"/><button type="button" className="button-secondary" onClick={listen} aria-label="Speak your question">🎙</button><button type="button" className="button-primary" onClick={()=>ask()} disabled={busy||!question.trim()}>{busy?'Checking…':'Ask'}</button></div>{answer&&<div className="assistant-answer" role="status"><p>{answer}</p><button type="button" className="button-secondary" onClick={()=>{if(window.speechSynthesis){const utterance=new SpeechSynthesisUtterance(answer);utterance.lang='en-IN';window.speechSynthesis.speak(utterance)}}}>▶ Listen</button></div>}<div className="assistant-suggestions">{['How many products do I have?','Which products have low stock?','Show my pending enquiries'].map(item=><button type="button" key={item} onClick={()=>ask(item)}>{item}</button>)}</div></section>;
}

export function SellerInsights({ dashboard, enquiries, onEnquiryStatus, onConvertEnquiry, onOpenEnquiries }) {
  const data = dashboard || {};
  return <><div className="seller-stats business-stats"><div><small>TOTAL PRODUCTS</small><b>{data.totalProducts||0}</b></div><div><small>ACTIVE LISTINGS</small><b>{data.activeProducts||0}</b></div><div><small>AVAILABLE STOCK</small><b>{data.availableStock||0}</b></div><div><small>NEW ENQUIRIES</small><b>{data.newEnquiries||0}</b></div><div><small>ORDERS TO FULFIL</small><b>{data.pendingOrders||0}</b></div><div><small>DELIVERED SALES</small><b>₹{Number(data.sales||0).toLocaleString('en-IN')}</b></div></div><div className="business-panels"><section className="form-card"><div className="section-heading"><div><small>INVENTORY CHECK</small><h2>Running low</h2></div></div>{data.lowStock?.length?data.lowStock.map(product=><p className="business-list-item" key={product.id}><b>{product.name}</b><span>{product.stock} left</span></p>):<p className="business-muted">No products are running low.</p>}<h3>Popular products</h3>{data.popularProducts?.slice(0,3).map(product=><p className="business-list-item" key={product.id}><b>{product.name}</b><span>{product.unitsSold} sold</span></p>)}</section><section className="form-card"><div className="section-heading"><div><small>BUYER REQUESTS</small><h2>Recent enquiries</h2></div><button className="button-secondary" onClick={onOpenEnquiries}>View all</button></div>{enquiries?.length?enquiries.slice(0,3).map(item=><div className="business-enquiry" key={item.id}><b>{item.buyer_name} · {item.buyer_type}</b><span>{item.quantity} × {item.product_name} · {item.status}</span>{['New','Pending'].includes(item.status)&&<div><button className="button-secondary" onClick={()=>onEnquiryStatus(item.id,'Pending')}>Mark pending</button><button className="button-primary" onClick={()=>onConvertEnquiry(item.id)}>Accept & create order</button></div>}</div>):<p className="business-muted">No buyer enquiries yet.</p>}</section></div></>;
}

export function BuyerEnquiryForm({ product, onSubmit }) {
  const [buyerName, setBuyerName] = useState('');
  const [buyerType, setBuyerType] = useState('Retailer');
  const [quantity, setQuantity] = useState('10');
  const [requestedPrice, setRequestedPrice] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    try { await onSubmit({product_id:product.id,buyer_name:buyerName,buyer_type:buyerType,quantity:Number(quantity),requested_price:requestedPrice?Number(requestedPrice):null,message}); }
    finally { setBusy(false); }
  };
  return <form className="enquiry-form" onSubmit={submit}><h3>Contact seller · Request a bulk order</h3><label className="field-label">Your name<input value={buyerName} onChange={e=>setBuyerName(e.target.value)} minLength="2" required placeholder="Buyer or business name"/></label><label className="field-label">I am a<select value={buyerType} onChange={e=>setBuyerType(e.target.value)}>{['Retailer','Wholesaler','Bulk buyer','Online seller','Corporate buyer','Procurement organization'].map(type=><option key={type}>{type}</option>)}</select></label><div className="field-row"><label className="field-label">Quantity requested<input type="number" min="1" max={Math.max(product.stock||1,1)} value={quantity} onChange={e=>setQuantity(e.target.value)} required/></label><label className="field-label">Target price per piece (₹)<input type="number" min="1" value={requestedPrice} onChange={e=>setRequestedPrice(e.target.value)} placeholder="Optional"/></label></div><label className="field-label">Message<textarea rows="2" value={message} onChange={e=>setMessage(e.target.value)} placeholder="Tell the artisan what you need"/></label><button className="button-primary" disabled={busy||!product.stock}>{busy?'Sending…':'Send enquiry'}</button></form>;
}
