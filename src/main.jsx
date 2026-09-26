import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import './app.css';
import './app-polish.css';
import { ProductDetailsForm, ProductVoiceForm, ProductReviewForm } from './artisan-pages.jsx';
import { BusinessAssistant, BuyerEnquiryForm, SellerInsights } from './business-pages.jsx';

const catalog = [
  { id: 'vase', name: 'Terracotta Vase', price: 680, category: 'Pottery', image: 'pot', artisan: 'Artisan Kumar', rating: 4.8, stock: 12, tags: ['Handmade', 'Eco Friendly', 'Traditional'], description: 'Handcrafted terracotta vase with traditional design. Perfect for home decoration and gifting. Made by skilled rural artisans.' },
  { id: 'saree', name: 'Handloom Saree', price: 1250, category: 'Textiles', image: 'textile', artisan: 'Meena Devi', rating: 4.7, stock: 8, tags: ['Handwoven', 'Natural Dye'], description: 'A vibrant handloom saree, woven slowly on a traditional loom by artisan Meena Devi.' },
  { id: 'clay-set', name: 'Clay Pot Set', price: 950, category: 'Pottery', image: 'craft', artisan: 'Artisan Kumar', rating: 4.6, stock: 15, tags: ['Handmade', 'Kitchen'], description: 'A set of three useful clay pots, shaped by hand from locally sourced earth.' },
  { id: 'lamp', name: 'Terracotta Lamp', price: 420, category: 'Home Decor', image: 'lamp', artisan: 'Ravi Kumar', rating: 4.5, stock: 20, tags: ['Handmade', 'Festive'], description: 'A warm, handcrafted clay lamp with a timeless form.' },
  { id: 'wall-art', name: 'Terracotta Wall Art', price: 750, category: 'Home Decor', image: 'textile', artisan: 'Gujarat Collective', rating: 4.7, stock: 6, tags: ['Traditional', 'Wall Decor'], description: 'Colorful artisan made wall decor inspired by traditional Indian folk art.' },
];
const money = value => `₹ ${Number(value || 0).toLocaleString('en-IN')}`;
const spokenNumber = value => {
  const digits=String(value||'').replace(/,/g,'').match(/\d+(?:\.\d+)?/);if(digits)return Number(digits[0]);
  const small={zero:0,one:1,two:2,three:3,four:4,five:5,six:6,seven:7,eight:8,nine:9,ten:10,eleven:11,twelve:12,thirteen:13,fourteen:14,fifteen:15,sixteen:16,seventeen:17,eighteen:18,nineteen:19};
  const tens={twenty:20,thirty:30,forty:40,fifty:50,sixty:60,seventy:70,eighty:80,ninety:90};
  let total=0,group=0,found=false;
  for(const word of String(value||'').toLowerCase().replace(/-/g,' ').match(/[a-z]+/g)||[]){
    if(word in small){group+=small[word];found=true}else if(word in tens){group+=tens[word];found=true}else if(word==='hundred'){group=(group||1)*100;found=true}else if(word==='thousand'){total+=(group||1)*1000;group=0;found=true}else if(word==='lakh'||word==='lac'){total+=(group||1)*100000;group=0;found=true}else if(word==='and'){continue}else if(found)break;
  }
  return found?total+group:null;
};
const catalogCategory = answer => {
  const text=String(answer||'').toLowerCase();
  if(/pottery|potter|ceramic|clay|earthen|terracotta|\bpot\b|bowl|vase|cup|mug|plate/.test(text))return 'Pottery';
  if(/textile|fabric|cloth|saree|sari|weav|handloom|embroid/.test(text))return 'Textiles';
  if(/home decor|home decoration|decoration|decor|wall art|lamp|interior/.test(text))return 'Home Decor';
  if(/wood|woodwork|wooden|carv/.test(text))return 'Woodwork';
  if(/jewell?ery|ornament|necklace|earring/.test(text))return 'Jewellery';
  return null;
};
const API_ORIGIN = window.location.protocol === 'file:' ? 'http://127.0.0.1:8001' : '';
const OFFLINE_KEY = 'martisan-offline-demo-v1';
let offlineModeActive = new URLSearchParams(window.location.search).get('offline') === '1';
let memoryDemo = null;
const readOfflineDemo = () => {
  try { return JSON.parse(localStorage.getItem(OFFLINE_KEY) || 'null'); } catch { return memoryDemo; }
};
const writeOfflineDemo = data => {
  memoryDemo = data;
  try { localStorage.setItem(OFFLINE_KEY, JSON.stringify(data)); } catch { /* Some file:// browsers do not allow persistent local storage. */ }
};
const initialOfflineDemo = () => ({
  products: catalog.map(product => ({ ...product, status: 'Active', description_en: product.description, description_hi: '', material: '', color: '', size: '', making_method: '', production_time: '', production_cost: 0, source_photo: '' })),
  carts: { 'demo-buyer': [] }, orders: [], enquiries: [],
  profiles: { 'demo-buyer': { user_id: 'demo-buyer', role: 'buyer', name: 'Ravi Kumar', location: 'Tamil Nadu, India' }, 'demo-seller': { user_id: 'demo-seller', role: 'seller', name: 'Artisan Kumar', location: 'Tamil Nadu, India' } },
  priceHistory: [],
});
const offlineDate = () => new Date().toISOString().slice(0, 10);
const offlineDashboard = (data, artisan) => {
  const products = data.products.filter(product => product.artisan === artisan);
  const ids = new Set(products.map(product => product.id));
  const enquiries = data.enquiries.filter(item => ids.has(item.product_id));
  const orders = data.orders.map(order => ({ ...order, items: order.items.filter(item => ids.has(item.product_id)) })).filter(order => order.items.length);
  const popular = {};
  orders.forEach(order => order.items.forEach(item => { popular[item.product_id] = (popular[item.product_id] || 0) + item.quantity; }));
  return { totalProducts: products.length, activeProducts: products.filter(item => item.status === 'Active').length, availableStock: products.reduce((sum, item) => sum + item.stock, 0), newEnquiries: enquiries.filter(item => item.status === 'New').length, pendingOrders: orders.filter(item => ['Processing', 'Shipped'].includes(item.status)).length, sales: orders.filter(item => item.status === 'Delivered').reduce((sum, order) => sum + order.total, 0), lowStock: products.filter(item => item.stock <= 5), popularProducts: products.map(item => ({ id: item.id, name: item.name, unitsSold: popular[item.id] || 0 })).sort((a, b) => b.unitsSold - a.unitsSold).slice(0, 5), recentEnquiries: enquiries.slice(0, 5), recentOrders: orders.slice(0, 5) };
};
const offlineApi = (path, options = {}) => {
  const data = readOfflineDemo() || initialOfflineDemo();
  const url = new URL(path, window.location.href);
  const route = url.pathname.replace(/^\/api/, '');
  const method = options.method || 'GET';
  const body = typeof options.body === 'string' ? JSON.parse(options.body || '{}') : {};
  const parts = route.split('/').filter(Boolean).map(decodeURIComponent);
  const save = value => { writeOfflineDemo(data); return value; };
  const notFound = () => { throw new Error('Item not found in offline demo data.'); };
  if (parts[0] === 'products' && parts.length === 1) {
    if (method === 'GET') {
      const artisan = url.searchParams.get('artisan') || '';
      const search = (url.searchParams.get('search') || '').toLowerCase();
      const category = url.searchParams.get('category') || 'All';
      const includeInactive = url.searchParams.get('include_inactive') === 'true';
      let results = data.products.filter(item => (includeInactive || item.status === 'Active') && (!artisan || item.artisan === artisan) && (category === 'All' || item.category === category) && (!search || `${item.name} ${item.category} ${item.artisan} ${(item.tags || []).join(' ')}`.toLowerCase().includes(search)));
      if (url.searchParams.get('sort') === 'Price: low to high') results = [...results].sort((a, b) => a.price - b.price);
      if (url.searchParams.get('sort') === 'Price: high to low') results = [...results].sort((a, b) => b.price - a.price);
      return results;
    }
    if (method === 'POST') { const item = { ...body, id: `offline-${Date.now()}`, rating: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }; data.products.unshift(item); return save(item); }
  }
  if (parts[0] === 'products' && parts[1]) {
    const index = data.products.findIndex(item => item.id === parts[1]);
    if (index < 0) return notFound();
    if (method === 'GET') return data.products[index];
    if (method === 'PUT') { data.products[index] = { ...data.products[index], ...body, updated_at: new Date().toISOString() }; return save(data.products[index]); }
    if (method === 'DELETE') { data.products.splice(index, 1); return save(null); }
  }
  if (parts[0] === 'cart') {
    const user = url.searchParams.get('user_id') || 'demo-buyer';
    data.carts[user] ||= [];
    if (parts.length === 1 && method === 'GET') return data.carts[user].map(line => ({ ...line, product: data.products.find(item => item.id === line.id) })).filter(line => line.product);
    if (parts[1] === 'items' && method === 'POST') {
      const product = data.products.find(item => item.id === body.product_id); if (!product) return notFound();
      const line = data.carts[user].find(item => item.id === body.product_id);
      if (line) line.qty += body.quantity || 1; else data.carts[user].push({ id: body.product_id, qty: body.quantity || 1 });
      return save(data.carts[user].map(item => ({ ...item, product: data.products.find(p => p.id === item.id) })));
    }
    if (parts[1] === 'items' && parts[2]) {
      const lineIndex = data.carts[user].findIndex(item => item.id === parts[2]); if (lineIndex < 0) return notFound();
      if (method === 'DELETE') data.carts[user].splice(lineIndex, 1);
      else if (method === 'PATCH') { if (!body.quantity) data.carts[user].splice(lineIndex, 1); else data.carts[user][lineIndex].qty = body.quantity; }
      return save(data.carts[user].map(item => ({ ...item, product: data.products.find(p => p.id === item.id) })));
    }
  }
  if (parts[0] === 'orders') {
    if (parts.length === 1 && method === 'GET') return data.orders;
    if (parts.length === 1 && method === 'POST') {
      const user = body.user_id || 'demo-buyer'; const lines = data.carts[user] || [];
      const items = lines.map(line => { const product = data.products.find(item => item.id === line.id); if (!product) return null; product.stock = Math.max(0, product.stock - line.qty); return { product_id: product.id, name: product.name, price: product.price, quantity: line.qty }; }).filter(Boolean);
      const order = { id: `OFF-${Date.now()}`, user_id: user, status: 'Processing', total: items.reduce((sum, item) => sum + item.price * item.quantity, 0), items, date: offlineDate(), created_at: new Date().toISOString() };
      data.orders.unshift(order); data.carts[user] = []; return save(order);
    }
    if (parts[1] && method === 'PATCH') { const order = data.orders.find(item => item.id === parts[1]); if (!order) return notFound(); order.status = body.status; return save(order); }
  }
  if (parts[0] === 'profile') {
    const user = url.searchParams.get('user_id') || 'demo-buyer';
    if (method === 'GET') return data.profiles[user] || data.profiles['demo-buyer'];
    if (method === 'PUT') { data.profiles[user] = { user_id: user, ...body, updated_at: new Date().toISOString() }; return save(data.profiles[user]); }
  }
  if (parts[0] === 'pricing' && parts[1] === 'suggest' && method === 'POST') {
    const ranges = { Pottery: [500, 1100], Textiles: [900, 1800], 'Home Decor': [600, 1400], Woodwork: [1000, 2200], Jewellery: [500, 1500], Other: [500, 1300] };
    const [marketLow, marketHigh] = ranges[body.category] || ranges.Other; const cost = Number(body.production_cost) || 0;
    const lowPrice = Math.round(Math.max(marketLow, cost * 1.25) / 50) * 50; const highPrice = Math.round(Math.max(marketHigh, cost * 1.75, lowPrice + 100) / 50) * 50; const suggestedPrice = Math.round(((lowPrice + highPrice) / 2) / 50) * 50;
    return save({ productionCost: cost, marketReferenceLow: marketLow, marketReferenceHigh: marketHigh, lowPrice, highPrice, suggestedPrice, currency: 'INR', source: 'Offline category estimate', explanation: cost ? 'Offline estimate based on your costs and Martisan category references.' : 'Offline estimate based on category references. Add your costs for a more tailored range.' });
  }
  if (parts[0] === 'dashboard' && method === 'GET') return offlineDashboard(data, url.searchParams.get('artisan') || 'Artisan Kumar');
  if (parts[0] === 'enquiries') {
    if (parts.length === 1 && method === 'GET') { const artisan = url.searchParams.get('artisan') || 'Artisan Kumar'; const ids = new Set(data.products.filter(item => item.artisan === artisan).map(item => item.id)); return data.enquiries.filter(item => ids.has(item.product_id)); }
    if (parts.length === 1 && method === 'POST') { const product = data.products.find(item => item.id === body.product_id); if (!product) return notFound(); const item = { ...body, id: `ENQ-${Date.now()}`, product_name: product.name, status: 'New', date: offlineDate() }; data.enquiries.unshift(item); return save(item); }
    if (parts[1] && parts[2] === 'create-order' && method === 'POST') { const item = data.enquiries.find(row => row.id === parts[1]); if (!item) return notFound(); const product = data.products.find(row => row.id === item.product_id); if (!product) return notFound(); const unit = item.requested_price || product.price; const order = { id: `OFF-${Date.now()}`, user_id: `b2b:${item.buyer_name}`, status: 'Processing', total: unit * item.quantity, items: [{ product_id: product.id, name: product.name, price: unit, quantity: item.quantity }], date: offlineDate() }; product.stock = Math.max(0, product.stock - item.quantity); item.status = 'Accepted'; data.orders.unshift(order); save(data); return order; }
    if (parts[1] && method === 'PATCH') { const item = data.enquiries.find(row => row.id === parts[1]); if (!item) return notFound(); Object.assign(item, body); return save(item); }
  }
  if (parts[0] === 'assistant' && parts[1] === 'ask') {
    const dash = offlineDashboard(data, body.artisan || 'Artisan Kumar'); const q = String(body.question || '').toLowerCase();
    if (q.includes('low stock')) return { answer: dash.lowStock.length ? `Please check these products: ${dash.lowStock.map(item => `${item.name} (${item.stock} left)`).join(', ')}` : 'No listed products are low on stock.' };
    if (q.includes('sales') || q.includes('revenue')) return { answer: `Completed sales total ₹${dash.sales.toLocaleString('en-IN')}. This counts delivered orders only.` };
    if (q.includes('enquir')) return { answer: `You have ${dash.newEnquiries} new buyer enquiries.` };
    if (q.includes('order')) return { answer: `You have ${dash.pendingOrders} orders waiting to be fulfilled.` };
    return { answer: `You have ${dash.totalProducts} products, with ${dash.activeProducts} active listings.` };
  }
  if (parts[0] === 'catalog' && parts[1] === 'generate') {
    const form = options.body; const transcript = form instanceof FormData ? String(form.get('transcript') || '') : '';
    const get = label => transcript.match(new RegExp(`^${label}:\\s*(.+)$`, 'im'))?.[1]?.trim() || '';
    const name = get('Product name') || 'Handcrafted artisan product'; const category = get('Category') || 'Other'; const story = get('Product story') || 'Handcrafted with care by an Indian artisan.';
    return { productName: name, category, descriptionEnglish: story, descriptionHindi: '', material: '', color: '', size: '', makingMethod: '', productionTime: '', keywords: ['Handmade', category], suggestedPrice: null, transcript, aiGenerated: false };
  }
  if (parts[0] === 'catalog' && ['transcribe', 'speak', 'remove-background'].includes(parts[1])) throw new Error('This feature needs the local API and/or AI service. Start Martisan online or run the local backend.');
  return save([]);
};
const api = async (path, options = {}) => {
  if (offlineModeActive) return offlineApi(path, options);
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  let response;
  try { response = await fetch(`${API_ORIGIN}/api${path}`, { ...options, headers: { ...(isFormData ? {} : { 'Content-Type': 'application/json' }), ...(options.headers || {}) } }); }
  catch { offlineModeActive = true; window.dispatchEvent(new Event('martisan-offline')); return offlineApi(path, options); }
  if (response.status === 204) return null;
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.detail || 'The server could not complete this request.');
  return result;
};

function Brand({ compact = false }) { return <div className={`brand ${compact?'compact-brand':''}`}><span className="brand-leaf">✿</span><div><b>martisan</b>{!compact&&<small>Crafts to Global Markets</small>}</div></div> }
function Pottery({ type = 'pot', photo }) { return <div className={`product-art art-${type}${photo?' photo-art':''}`} aria-hidden="true">{photo?<img src={photo} alt=""/>:type==='textile'?<div className="woven-art">✳<br/>✺<br/>✳</div>:type==='lamp'?<div className="clay-lamp"><i/></div>:type==='craft'?<div className="clay-set">🏺<br/>🏺</div>:<div className="clay-vase"><i>✿ 〰 ✿</i></div>}</div> }
function ProductCard({ product, onOpen, onAdd, onEdit, onDelete, compact = false }) { return <article className={`product-card ${compact?'compact-product':''}`}><button className="product-open" onClick={()=>onOpen(product)} aria-label={`View ${product.name}`}><Pottery type={product.image} photo={product.photo}/><span className="product-copy"><b>{product.name}</b><strong>{money(product.price)}</strong><small><span className="star">★</span> {product.rating}　·　{product.category}</small></span></button>{onAdd&&<button className="add-cart-small" onClick={()=>onAdd(product)} aria-label={`Add ${product.name} to cart`}>＋</button>}{onEdit&&<div className="seller-product-actions"><button onClick={()=>onEdit(product)}>Edit</button><button onClick={()=>onDelete(product)} aria-label={`Delete ${product.name}`}>Delete</button></div>}</article> }
function Header({ title, back, onBack, trailing }) { return <div className="app-header">{back&&<button className="icon-button" onClick={onBack} aria-label="Go back">←</button>}<h1>{title}</h1>{trailing||<span className="header-spacer"/>}</div> }
function BottomNav({ role, page, go, cartCount }) { const items=role==='seller'?[['⌂','Home','sellerHome'],['▤','Products','products'],['✉','Enquiries','enquiries'],['▣','Orders','orders'],['♙','Profile','profile']]:[['⌂','Home','buyerHome'],['▦','Categories','search'],['🛒','Cart','cart'],['♙','Profile','profile']];return <nav className="bottom-nav">{items.map(([icon,label,target])=><button key={target} className={page===target?'active':''} onClick={()=>go(target)}><span>{icon}{target==='cart'&&cartCount>0&&<i className="cart-badge">{cartCount}</i>}</span><small>{label}</small></button>)}</nav> }
function App(){
  const [page,setPage]=useState('welcome'); const [role,setRole]=useState('buyer'); const [previous,setPrevious]=useState('buyerHome');
  const [products,setProducts]=useState([]); const [cart,setCart]=useState([]); const [orders,setOrders]=useState([]); const [enquiries,setEnquiries]=useState([]); const [dashboard,setDashboard]=useState(null);
  const [selected,setSelected]=useState(catalog[0]); const [query,setQuery]=useState(''); const [category,setCategory]=useState('All'); const [sort,setSort]=useState('Featured'); const [notice,setNotice]=useState(''); const [apiError,setApiError]=useState(''); const [offlineDemo,setOfflineDemo]=useState(false); const [profileName,setProfileName]=useState('Ravi Kumar'); const [profileLocation,setProfileLocation]=useState('Tamil Nadu, India'); const [profileEditing,setProfileEditing]=useState(false);
  const emptyDraft=()=>({name:'',category:'Pottery',price:'',suggestedPrice:'',suggestedLow:'',suggestedHigh:'',suggestionSource:'',priceExplanation:'',production_cost:'',material:'',color:'',size:'',making_method:'',production_time:'',stock:'',status:'Active',description:'',description_en:'',description_hi:'',keywords:[],image:'pot'});
  const [draft,setDraft]=useState(emptyDraft); const [photo,setPhoto]=useState(''); const [sourcePhoto,setSourcePhoto]=useState(''); const [sourceImage,setSourceImage]=useState(null); const [voiceTranscript,setVoiceTranscript]=useState(''); const [catalogBusy,setCatalogBusy]=useState(false); const [voiceActive,setVoiceActive]=useState(false); const [editingId,setEditingId]=useState(null);
  useEffect(()=>{const showOffline=()=>setOfflineDemo(true);window.addEventListener('martisan-offline',showOffline);Promise.all([api('/products'),api('/cart'),api('/orders'),api('/profile')]).then(([p,c,o,profile])=>{setProducts(p);setCart(c);setOrders(o);setProfileName(profile.name);setProfileLocation(profile.location);if(offlineModeActive)setOfflineDemo(true)}).catch(error=>setApiError(`Backend connection failed: ${error.message}`));return()=>window.removeEventListener('martisan-offline',showOffline)},[]);
  const go=next=>{setPage(next);window.scrollTo({top:0,behavior:'smooth'});}; const say=text=>{setNotice(text);window.setTimeout(()=>setNotice(''),2400)};
  const filtered=useMemo(()=>{const matches=products.filter(p=>p.status==='Active'&&(category==='All'||p.category===category)&&(`${p.name} ${p.category} ${p.artisan} ${p.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())));if(sort==='Price: low to high')matches.sort((a,b)=>a.price-b.price);if(sort==='Price: high to low')matches.sort((a,b)=>b.price-a.price);return matches},[products,category,query,sort]);
  const addToCart=async p=>{try{const next=await api('/cart/items',{method:'POST',body:JSON.stringify({product_id:p.id,quantity:1})});setCart(next);say(`${p.name} added to your cart`)}catch(error){say(error.message)}};
  const updateQty=async(id,delta)=>{const line=cart.find(x=>x.id===id);if(!line)return;try{const next=await api(`/cart/items/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({quantity:Math.max(0,line.qty+delta)})});setCart(next)}catch(error){say(error.message)}};
  const cartLines=cart.map(line=>({...line,product:line.product||products.find(p=>p.id===line.id)||catalog[0]})); const cartCount=cart.reduce((n,x)=>n+x.qty,0); const subtotal=cartLines.reduce((n,x)=>n+x.product.price*x.qty,0);
  const changeRole=async next=>{setRole(next);setProfileName(next==='seller'?'Artisan Kumar':'Ravi Kumar');try{const user_id=next==='seller'?'demo-seller':'demo-buyer';const profile=await api(`/profile?user_id=${user_id}`,{method:'PUT',body:JSON.stringify({role,name:next==='seller'?'Artisan Kumar':'Ravi Kumar',location:profileLocation})});const nextOrders=await api(`/orders?user_id=${user_id}`);setProfileName(profile.name);setProfileLocation(profile.location);setOrders(nextOrders);if(next==='seller'){const [d,e,p]=await Promise.all([api(`/dashboard?artisan=${encodeURIComponent(profile.name)}`),api(`/enquiries?artisan=${encodeURIComponent(profile.name)}`),api(`/products?artisan=${encodeURIComponent(profile.name)}&include_inactive=true`)]);setDashboard(d);setEnquiries(e);setProducts(p)}else setProducts(await api('/products'))}catch(error){say(error.message)}go(next==='seller'?'sellerHome':'buyerHome')};
  const openProduct=p=>{setSelected(p);setPrevious(page);go('detail')}; const resetDraft=()=>{setDraft(emptyDraft());setPhoto('');setSourcePhoto('');setSourceImage(null);setVoiceTranscript('');setVoiceActive(false);setEditingId(null)};
  const editProduct=async p=>{try{const full=await api(`/products/${encodeURIComponent(p.id)}`);setEditingId(full.id);setDraft({...emptyDraft(),...full,price:String(full.price),stock:String(full.stock),production_cost:String(full.production_cost||'')});setPhoto(full.photo||'');setSourcePhoto(full.source_photo||full.photo||'');setSourceImage(null);setVoiceTranscript('');go('add')}catch(error){say(error.message)}};
  const imageDataBlob=async dataUrl=>{const response=await fetch(dataUrl);return response.blob()};
  const generateCatalog=async({transcript='',imageFile=null,imageData=''}={})=>{
    if(!transcript.trim()&&!imageFile&&!imageData)return null;
    const form=new FormData();
    if(transcript.trim())form.append('transcript',transcript.trim());
    if(imageFile)form.append('image',imageFile,imageFile.name||'artisan-product-image');
    else if(imageData){const blob=await imageDataBlob(imageData);form.append('image',blob,'artisan-product-image.png')}
    setCatalogBusy(true);
    try{
      const result=await api('/catalog/generate',{method:'POST',body:form});
      const allowedCategories=['Pottery','Textiles','Home Decor','Woodwork','Jewellery','Other'];
      setDraft(old=>({...old,name:old.name.trim()?old.name:(result.productName||old.name),category:transcript.includes('Category:')&&allowedCategories.includes(old.category)?old.category:(allowedCategories.includes(result.category)?result.category:old.category),suggestedPrice:result.suggestedPrice==null?old.suggestedPrice:String(result.suggestedPrice),suggestionSource:result.aiGenerated===false?'Basic market estimate':'AI catalog suggestion',description_en:old.description_en||result.descriptionEnglish||'',description_hi:old.description_hi||result.descriptionHindi||'',material:old.material||result.material||'',color:old.color||result.color||'',size:old.size||result.size||'',making_method:old.making_method||result.makingMethod||'',production_time:old.production_time||result.productionTime||'',keywords:Array.isArray(result.keywords)?result.keywords:old.keywords}));
      if(result.aiGenerated===false)say('Basic catalog created. Review the image details and add anything specific before publishing.');
      return result;
    }catch(error){say(error.message==='Failed to fetch'?'Catalog analysis could not reach the backend. Start the API server, then retry catalog analysis.':`Catalog analysis failed: ${error.message||'Please try again.'}`);return null}
    finally{setCatalogBusy(false)}
  };
  const transcribeVoice=async audioBlob=>{
    const form=new FormData();
    const extension=audioBlob.type.includes('ogg')?'ogg':audioBlob.type.includes('mp4')?'m4a':'webm';
    form.append('audio',audioBlob,`voice-note.${extension}`);
    try{return await api('/catalog/transcribe',{method:'POST',body:form})}
    catch(error){throw new Error(error.message==='AI catalog is not configured'?'Voice transcription needs OPENAI_API_KEY set in backend/.env.':'Unable to transcribe the voice input. Please try again.')}
  };
  const speakVoice=async(text,language)=>{
    const response=await fetch(`${API_ORIGIN}/api/catalog/speak`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text,language})});
    if(!response.ok){const result=await response.json().catch(()=>({}));throw new Error(result.detail==='AI catalog is not configured'?'Voice assistant needs OPENAI_API_KEY set in backend/.env.':result.detail||'Unable to speak the question. Please try again.')}
    return response.blob();
  };
  const removeProductBackground=async imageFile=>{
    const form=new FormData();form.append('image',imageFile,imageFile.name||'artisan-product');
    try{return await api('/catalog/remove-background',{method:'POST',body:form})}
    catch(error){throw new Error(error.message==='Failed to fetch'?'The image service is unavailable because the backend is not running. Start the API server and retry.':`Background removal failed: ${error.message||'Please try again.'}`)}
  };
  const suggestPricing=async()=>{try{const result=await api('/pricing/suggest',{method:'POST',body:JSON.stringify({name:draft.name,category:draft.category,production_cost:Number(draft.production_cost),product_id:editingId||null})});setDraft(old=>({...old,suggestedPrice:String(result.suggestedPrice),suggestedLow:String(result.lowPrice),suggestedHigh:String(result.highPrice),suggestionSource:result.source,priceExplanation:result.explanation,price:String(result.suggestedPrice)}));say(`Suggested price ₹${Number(result.suggestedPrice).toLocaleString('en-IN')} added to the price field. You can still edit it.`)}catch(error){say(`Price suggestion failed: ${error.message}`)}};
  const askAssistant=question=>api('/assistant/ask',{method:'POST',body:JSON.stringify({question,artisan:profileName})});
  const submitEnquiry=async data=>{try{await api('/enquiries',{method:'POST',body:JSON.stringify(data)});say('Enquiry sent to the artisan');go('buyerHome')}catch(error){say(error.message)}};
  const updateEnquiry=async(id,status)=>{try{const updated=await api(`/enquiries/${encodeURIComponent(id)}`,{method:'PATCH',body:JSON.stringify({status})});setEnquiries(old=>old.map(item=>item.id===id?updated:item));const next=await api(`/dashboard?artisan=${encodeURIComponent(profileName)}`);setDashboard(next);say(`Enquiry ${status.toLowerCase()}`)}catch(error){say(error.message)}};
  const convertEnquiry=async id=>{try{const order=await api(`/enquiries/${encodeURIComponent(id)}/create-order`,{method:'POST'});setOrders(old=>[order,...old]);setEnquiries(old=>old.map(item=>item.id===id?{...item,status:'Accepted'}:item));setProducts(old=>old.map(product=>product.id===order.items?.[0]?.product_id?{...product,stock:Math.max(0,product.stock-order.items[0].quantity)}:product));setDashboard(await api(`/dashboard?artisan=${encodeURIComponent(profileName)}`));say(`Accepted. Order ${order.id} created.`)}catch(error){say(error.message)}};
  const saveProductStatus=async(product,status)=>{try{const full=await api(`/products/${encodeURIComponent(product.id)}`);const saved=await api(`/products/${encodeURIComponent(product.id)}`,{method:'PUT',body:JSON.stringify({...full,status})});setProducts(old=>old.map(item=>item.id===saved.id?saved:item));setDashboard(await api(`/dashboard?artisan=${encodeURIComponent(profileName)}`));say(`${product.name} marked ${status.toLowerCase()}`)}catch(error){say(error.message)}};
  const acceptInterviewAnswer=(answer,field)=>{
    const text=String(answer||'').trim();
    if(!text)return false;
    const patch={};
    if(field==='name')patch.name=text;
    if(field==='category')patch.category=catalogCategory(text)||'Other';
    if(field==='price'){const price=spokenNumber(text);if(price===null||price<=0)return false;patch.price=String(price)}
    if(field==='stock'){const stock=spokenNumber(text);if(stock===null||stock<0)return false;patch.stock=String(Math.floor(stock))}
    if(field==='description')patch.description=text;
    if(!Object.keys(patch).length)return false;
    setDraft(old=>({...old,...patch}));
    const label={name:'Product name',category:'Category',price:'Price',stock:'Stock available',description:'Product story'}[field]||field;
    setVoiceTranscript(old=>`${old?`${old}\n`:''}${label}: ${answer}`);
    return true;
  };
  const completeInterview=async answers=>{
    const summary=[['Product name',answers.name],['Category',answers.category],['Price in rupees',answers.price],['Stock available',answers.stock],['Product story',answers.description]].filter(([,value])=>value).map(([label,value])=>`${label}: ${value}`).join('\n');
    const price=spokenNumber(answers.price||'');
    const stock=spokenNumber(answers.stock||'');
    setDraft(old=>({...old,name:answers.name?.trim()||old.name,category:catalogCategory(answers.category||'')||old.category,price:price>0?String(price):old.price,stock:stock!==null&&stock>=0?String(Math.floor(stock)):old.stock,description:answers.description?.trim()||old.description}));
    setVoiceTranscript(summary);
    return Boolean(await generateCatalog({transcript:summary,imageData:photo||(!sourceImage?sourcePhoto:''),imageFile:photo||!sourceImage?null:sourceImage}));
  };
  const generateFromStory=()=>generateCatalog({transcript:[`Product name: ${draft.name}`,`Category: ${draft.category}`,`Price in rupees: ${draft.price}`,`Stock available: ${draft.stock}`,`Product story: ${draft.description}`].join('\n'),imageData:photo||(!sourceImage?sourcePhoto:''),imageFile:photo||!sourceImage?null:sourceImage});  const deleteProduct=async p=>{if(!window.confirm(`Remove ${p.name} from your shop?`))return;try{await api(`/products/${encodeURIComponent(p.id)}`,{method:'DELETE'});setProducts(old=>old.filter(x=>x.id!==p.id));say('Product removed from your shop')}catch(error){say(error.message)}};
  const publish=async()=>{const description=draft.description_en||draft.description||'';const stock=Number(draft.stock||0);const p={name:draft.name,price:Number(draft.price),stock,category:draft.category,image:photo?'uploaded':draft.image,photo:photo||null,source_photo:sourcePhoto||null,artisan:profileName,tags:draft.keywords.length?draft.keywords:['Handmade','Traditional'],description,description_en:draft.description_en||description,description_hi:draft.description_hi||'',material:draft.material||'',color:draft.color||'',size:draft.size||'',making_method:draft.making_method||'',production_time:draft.production_time||'',production_cost:Number(draft.production_cost||0),status:draft.status==='Draft'?'Draft':stock===0?'Out of stock':'Active'};try{const saved=await api(editingId?`/products/${encodeURIComponent(editingId)}`:'/products',{method:editingId?'PUT':'POST',body:JSON.stringify(p)});setProducts(old=>editingId?old.map(x=>x.id===editingId?saved:x):[saved,...old]);setDashboard(await api(`/dashboard?artisan=${encodeURIComponent(profileName)}`));resetDraft();setRole('seller');go('products');say(editingId?'Product updated':'Your product is now published')}catch(error){say(error.message)}};  const placeOrder=async()=>{if(!cartCount){say('Your cart is empty');return}try{const order=await api('/orders',{method:'POST',body:JSON.stringify({user_id:'demo-buyer'})});setOrders(old=>[order,...old]);setCart([]);setRole('buyer');go('orders');say('Order placed successfully')}catch(error){say(error.message)}};
  const shell=(title,content,{back=true,nav=true}={})=><div className="app-shell"><header className="topbar"><button className="brand-button" onClick={()=>go(role==='seller'?'sellerHome':'buyerHome')}><Brand compact/></button><div className="top-actions"><button className="top-icon" onClick={()=>go('search')} aria-label="Search">⌕</button><button className="top-icon cart-top" onClick={()=>go('cart')} aria-label={`Cart, ${cartCount} items`}>🛒{cartCount>0&&<i>{cartCount}</i>}</button><button className="avatar-button" onClick={()=>go('profile')}>RK</button></div></header>{offlineDemo&&<div className="api-banner" role="status">Offline demo mode: products, prices, cart, and orders are stored in this browser. AI transcription and background removal need local services.</div>}{apiError&&<div className="api-banner" role="alert">{apiError} Start the FastAPI server and refresh. <button onClick={()=>setApiError('')}>×</button></div>}<main className="app-main">{title&&<Header title={title} back={back} onBack={()=>go(previous)}/ >}{content}</main>{nav&&<BottomNav role={role} page={page} go={go} cartCount={cartCount}/ >}{notice&&<div className="toast" role="status">{notice}</div>}</div>;

  if(page==='welcome')return <div className="welcome-page"><div className="welcome-top"><Brand/><span className="welcome-pill">A MARKETPLACE WITH MEANING</span><h1>Crafts to global markets.<br/><em>Made with human hands.</em></h1><p>Discover the stories, skills, and traditions behind India's handmade treasures.</p><div className="welcome-art"><div className="welcome-sun"/><span className="welcome-weaver">🧑🏽‍🎨</span><span className="welcome-pot">🏺</span><span className="welcome-cloth">✳　✺　✳<br/>✺　✳　✺</span></div></div><section className="role-picker"><h2>How would you like to join?</h2><p>Choose an experience to get started.</p><div className="role-options"><button onClick={()=>changeRole('seller')}><span className="role-icon seller-icon">✿</span><span><b>I'm an artisan</b><small>Share your craft and grow your business</small></span><i>→</i></button><button onClick={()=>changeRole('buyer')}><span className="role-icon buyer-icon">⌕</span><span><b>I'm a buyer</b><small>Find meaningful, handmade pieces</small></span><i>→</i></button></div><small className="gov-note">Supporting India's artisan communities</small></section></div>;

  if(page==='sellerHome')return shell('',<><section className="seller-welcome"><div><small>GOOD MORNING,</small><h2>{profileName} <span>👋</span></h2><p>Your craft is making its way to the world.</p></div><div className="support-banner"><div><b>Your Craft.<br/>Our Support.</b><span>Let’s grow together</span></div><div>🧑🏽‍🎨　🏺</div></div></section><div className="content-width"><button className="big-add" onClick={()=>{resetDraft();go('add')}}><span>＋</span><b>Add a product</b><i>→</i></button><button className="button-secondary" onClick={()=>{resetDraft();go('add')}}>🎙 Start voice catalog</button><SellerInsights dashboard={dashboard} enquiries={enquiries} onEnquiryStatus={updateEnquiry} onConvertEnquiry={convertEnquiry} onOpenEnquiries={()=>go('enquiries')}/><BusinessAssistant onAsk={askAssistant}/><div className="section-heading"><div><small>YOUR SHOP</small><h2>Quick access</h2></div></div><div className="quick-links"><button onClick={()=>go('products')}><span>▤</span><b>My products</b><small>Manage your catalog</small></button><button onClick={()=>go('orders')}><span>▣</span><b>Orders</b><small>Track your sales</small></button><button onClick={()=>go('enquiries')}><span>✉</span><b>Enquiries</b><small>Respond to buyers</small></button><button onClick={()=>go('profile')}><span>♙</span><b>Your profile</b><small>View your shop</small></button></div><div className="section-heading"><div><small>RECENT ACTIVITY</small><h2>Keep up the good work</h2></div></div><div className="activity-card"><span>↗</span><div><b>Your shop is ready for its next story</b><small>Add a new product to reach more buyers.</small></div><button onClick={()=>{resetDraft();go('add')}}>＋</button></div></div></>);

  if(page==='products')return shell('My Products',<div className="content-width"><div className="page-intro"><p>Manage the handmade pieces in your shop.</p><button className="button-primary" onClick={()=>{resetDraft();go('add')}}>＋ Add product</button></div><div className="seller-product-grid">{products.filter(p=>p.artisan===profileName).map(p=><div className="seller-product-management" key={p.id}><ProductCard product={p} onOpen={openProduct} onEdit={editProduct} onDelete={deleteProduct}/><div className="product-management-meta"><span className={`order-status ${(p.status||"Active").toLowerCase().replaceAll(" ","-")}`}>{p.status||"Active"}</span><span>{p.stock} pieces</span><select aria-label={`Status for ${p.name}`} value={p.status||"Active"} onChange={e=>saveProductStatus(p,e.target.value)}><option>Active</option><option>Draft</option><option>Out of stock</option></select></div></div>)}</div>{!products.some(p=>p.artisan===profileName)&&<div className="empty-state">🏺<b>Your shop is ready for its first product</b><span>Add handmade pieces to start your catalog.</span><button className="button-primary" onClick={()=>go('add')}>Add your first product</button></div>}</div>);

  if(page === "add") return shell(editingId ? "Edit Product" : "Add Product", <ProductDetailsForm draft={draft} setDraft={setDraft} photo={photo} setPhoto={setPhoto} sourcePhoto={sourcePhoto} setSourcePhoto={setSourcePhoto} voiceActive={voiceActive} catalogBusy={catalogBusy} onStatus={say} onSpeak={speakVoice} onActiveChange={setVoiceActive} onInterviewAnswer={acceptInterviewAnswer} onInterviewComplete={completeInterview} onTranscribe={transcribeVoice} onRemoveBackground={removeProductBackground} onSuggestPricing={suggestPricing} onAnalyzeImage={(file,cleanedPhoto)=>{setSourceImage(file);return generateCatalog({imageFile:cleanedPhoto?'':file,imageData:cleanedPhoto||''})}} onContinue={() => go("voice")} />);

  if(page === "voice") return shell("Product Story", <ProductVoiceForm draft={draft} setDraft={setDraft} transcript={voiceTranscript} catalogBusy={catalogBusy} onStatus={say} onGenerateCatalog={generateFromStory} onBack={() => go("add")} onContinue={() => go("review")} />);

  if(page === "review") return shell("Review Product", <ProductReviewForm draft={draft} photo={photo} editing={Boolean(editingId)} onBack={() => go("voice")} onPublish={publish} />);

  if(page==='buyerHome')return shell('',<div className="content-width buyer-content"><div className="buyer-hero"><div className="buyer-hero-copy"><span>ROOTED IN TRADITION, MADE FOR TODAY</span><h2>Find something<br/><em>with a story.</em></h2><p>Discover handmade treasures from India’s artisan communities.</p><button className="button-light" onClick={()=>go('search')}>Explore the collection <span>→</span></button></div><div className="hero-craft">🏺<span>✳</span></div></div><label className="search-field"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products, crafts, artisans..."/><button onClick={()=>go('search')}>Search</button></label><div className="category-section"><div className="section-heading"><div><small>SHOP BY CRAFT</small><h2>Find your kind of handmade</h2></div><button onClick={()=>go('search')}>All categories →</button></div><div className="category-tiles">{[['All','✦'],['Pottery','🏺'],['Textiles','🧵'],['Home Decor','✿'],['Woodwork','🪵']].map(([name,icon])=><button className={category===name?'chosen':''} onClick={()=>{setCategory(name);go('search')}} key={name}><span>{icon}</span><b>{name==='All'?'All crafts':name}</b></button>)}</div></div><div className="section-heading product-section-heading"><div><small>MADE WITH CARE</small><h2>Featured finds</h2></div><button onClick={()=>go('search')}>View all →</button></div><div className="buyer-product-grid">{products.slice(0,4).map(p=><ProductCard key={p.id} product={p} onOpen={openProduct} onAdd={addToCart}/>)}</div><section className="artisan-note"><span>✿</span><div><small>EVERY PURCHASE MAKES A DIFFERENCE</small><h2>Keep a craft alive.</h2><p>Meet the makers preserving skills and stories passed down through generations.</p></div><button onClick={()=>go('search')}>Meet our artisans →</button></section></div>);

  if(page==='search')return shell('Explore Crafts',<div className="content-width search-content"><label className="search-field"><span>⌕</span><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search products, crafts, artisans..."/><button onClick={()=>setQuery('')}>Clear</button></label><div className="filter-row"><div className="category-filters">{['All','Pottery','Textiles','Home Decor','Woodwork'].map(x=><button className={category===x?'chosen':''} onClick={()=>setCategory(x)} key={x}>{x}</button>)}</div><select aria-label="Sort products" value={sort} onChange={e=>setSort(e.target.value)}><option>Featured</option><option>Price: low to high</option><option>Price: high to low</option></select></div><p className="result-count">{filtered.length} handmade {filtered.length===1?'find':'finds'} to explore</p><div className="buyer-product-grid">{filtered.map(p=><ProductCard key={p.id} product={p} onOpen={openProduct} onAdd={addToCart}/>)}</div>{!filtered.length&&<div className="empty-state"><span>⌕</span><b>No crafts found</b><small>Try a different search or category.</small><button className="button-secondary" onClick={()=>{setQuery('');setCategory('All')}}>Clear filters</button></div>}</div>);

  if(page==='detail')return shell(selected.name,<div className="detail-layout content-width"><Pottery type={selected.image} photo={selected.photo}/><div className="detail-copy"><span className="eyebrow">{selected.category.toUpperCase()} · MADE IN INDIA</span><h2>{selected.name}</h2><div className="detail-rating"><b>{money(selected.price)}</b><span>★ {selected.rating}</span></div><div className="product-tags">{selected.tags.map(t=><span key={t}>{t}</span>)}</div><h3>Product story</h3><p>{selected.description}</p>{(selected.material||selected.color||selected.size)&&<div className="product-attributes">{selected.material&&<p><b>Material</b> {selected.material}</p>}{selected.color&&<p><b>Color</b> {selected.color}</p>}{selected.size&&<p><b>Size</b> {selected.size}</p>}</div>}<div className="maker-card"><span>🧑🏽‍🎨</span><div><small>MADE BY</small><b>{selected.artisan}</b><small>Tamil Nadu, India</small></div><button className="button-secondary" onClick={()=>say('Artisan shop profile')}>View shop</button></div><div className="stock-note">● {selected.stock>0?`${selected.stock} available · Ships with care from the artisan’s workshop`:'Currently out of stock'}</div><div className="detail-actions"><button className="button-secondary" disabled={!selected.stock} onClick={()=>addToCart(selected)}>Add to cart</button><button className="button-primary" disabled={!selected.stock} onClick={()=>{addToCart(selected);go('cart')}}>Buy now</button></div><BuyerEnquiryForm product={selected} onSubmit={submitEnquiry}/></div></div>);

  if(page==='cart')return shell('My Cart',<div className="content-width cart-content">{cartLines.length? <><div className="cart-lines">{cartLines.map(({id,qty,product:p})=><div className="cart-line" key={id}><Pottery type={p.image} photo={p.photo}/><div className="cart-line-copy"><b>{p.name}</b><small>{p.category} · Handmade</small><strong>{money(p.price)}</strong></div><div className="qty-control"><button onClick={()=>updateQty(id,-1)} aria-label="Decrease quantity">−</button><span>{qty}</span><button onClick={()=>updateQty(id,1)} aria-label="Increase quantity">＋</button></div><button className="remove-line" onClick={()=>updateQty(id,-qty)} aria-label={`Remove ${p.name}`}>×</button></div>)}</div><div className="cart-summary"><h2>Order summary</h2><p><span>Subtotal ({cartCount} items)</span><b>{money(subtotal)}</b></p><p><span>Shipping</span><b className="free-shipping">FREE</b></p><hr/><p className="grand-total"><span>Total</span><b>{money(subtotal)}</b></p><button className="button-primary checkout-button" onClick={placeOrder}>Place order <span>→</span></button><small className="secure-note">Supporting artisans with every order</small></div></>:<div className="empty-state"><span>🛒</span><b>Your cart is waiting for a story</b><small>Explore handmade finds and add your favorites.</small><button className="button-primary" onClick={()=>go('search')}>Explore crafts</button></div>}</div>);

  if(page==='enquiries')return shell('Buyer Enquiries',<div className="content-width orders-content">{enquiries.length?enquiries.map(item=><article className="order-card" key={item.id}><div><small>{item.id} · {item.product_name}</small><span className={`order-status ${item.status.toLowerCase()}`}>{item.status}</span></div><p>{item.buyer_name} <span>· {item.buyer_type}</span></p><p>{item.quantity} pieces{item.requested_price?` · target ₹${Number(item.requested_price).toLocaleString('en-IN')} each`:''}</p>{item.message&&<p>{item.message}</p>}<small>Received {item.date}</small>{['New','Pending'].includes(item.status)&&<div className="enquiry-actions"><button className="button-secondary" onClick={()=>updateEnquiry(item.id,'Declined')}>Decline</button><button className="button-primary" onClick={()=>convertEnquiry(item.id)}>Accept & create order</button>{item.status==='New'&&<button className="button-secondary" onClick={()=>updateEnquiry(item.id,'Pending')}>Mark pending</button>}</div>}{item.status==='Accepted'&&<button className="button-primary" onClick={()=>updateEnquiry(item.id,'Completed')}>Mark completed</button>}</article>):<div className="empty-state"><span>✉</span><b>No buyer enquiries yet</b><small>Bulk buyer requests will appear here.</small></div>}</div>);
  if(page==='orders')return shell(role==='seller'?'Incoming Orders':'My Orders',<div className="content-width orders-content">{orders.length?orders.map(o=><article className="order-card" key={o.id}><div><small>ORDER #{o.id}</small><span className={`order-status ${o.status.toLowerCase()}`}>{o.status}</span></div><p>{money(o.total)} <span>· {o.items?.reduce((n,x)=>n+x.quantity,0)||1} item(s)</span></p><small>Placed {o.date}</small>{role==='seller'&&<button className="button-secondary" onClick={async()=>{const next=o.status==='Processing'?'Shipped':'Delivered';try{const saved=await api(`/orders/${encodeURIComponent(o.id)}`,{method:'PATCH',body:JSON.stringify({status:next})});setOrders(old=>old.map(x=>x.id===o.id?saved:x));say('Order status updated')}catch(error){say(error.message)}}}>Mark {o.status==='Processing'?'shipped':'delivered'}</button>}</article>):<div className="empty-state"><span>▣</span><b>No orders just yet</b><small>Your orders will appear here.</small>{role==='buyer'&&<button className="button-primary" onClick={()=>go('search')}>Explore crafts</button>}</div>}</div>);

  return shell('Your Profile',<div className="content-width profile-content"><div className="profile-hero"><span>👨🏽‍🦱</span><div><small>{role==='seller'?'ARTISAN SELLER':'MARTISAN BUYER'}</small>{profileEditing?<><input className="profile-input" value={profileName} onChange={e=>setProfileName(e.target.value)}/><input className="profile-input" value={profileLocation} onChange={e=>setProfileLocation(e.target.value)}/></>:<><h2>{profileName}</h2><p>Member · {profileLocation}</p></>}</div><button className="button-secondary" onClick={async()=>{if(profileEditing){try{const profile=await api(`/profile?user_id=${role==='seller'?'demo-seller':'demo-buyer'}`,{method:'PUT',body:JSON.stringify({role,name:profileName,location:profileLocation})});setProfileName(profile.name);say('Profile saved');setProfileEditing(false)}catch(error){say(error.message)}}else setProfileEditing(true)}}>{profileEditing?'Save profile':'Edit profile'}</button></div><div className="profile-menu">{[['▣','My Orders','orders'],['⌖','My Addresses',null],['?','Help & Support',null],['ⓘ','About Martisan',null]].map(([icon,label,target])=><button key={label} onClick={()=>target?go(target):say(`${label} coming soon`)}><span>{icon}</span><b>{label}</b><i>→</i></button>)}</div><div className="profile-role"><div><b>Your marketplace experience</b><small>Switch between shopping and selling.</small></div><button className="button-secondary" onClick={()=>changeRole(role==='buyer'?'seller':'buyer')}>Switch to {role==='buyer'?'artisan':'buyer'}</button></div><button className="logout-button" onClick={()=>go('welcome')}>←　Back to welcome</button></div>);
}

createRoot(document.getElementById('root')).render(<App/>);
