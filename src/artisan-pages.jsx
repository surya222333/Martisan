import React from 'react';
import { FieldVoiceInput, ProductPhoto } from './artisan-tools.jsx';
import { getArtisanCopy } from './artisan-i18n.js';

const stepper=(n,ui)=> <div className="stepper">{[1,2,3].map((x)=><React.Fragment key={x}>{x>1&&<i/>}<b className={x===n?'current':x<n?'done':''}>{x<n?'✓':`0${x}`} <span>{[ui.stepDetails,ui.stepCatalog,ui.stepReview][x-1]}</span></b></React.Fragment>)}</div>;

export function ProductDetailsForm({ draft, setDraft, photo, setPhoto, sourcePhoto, setSourcePhoto, onStatus, onSpeak, onTranscribe, onActiveChange, onImageReady, onRemoveBackground, onSuggestPricing, voiceActive, catalogBusy, appUi={}, onContinue }) {
  const [validationError,setValidationError]=React.useState('');
  const voiceSessionRef=React.useRef(null);
  const language=draft.voiceLanguage||'en-IN';
  const ui=getArtisanCopy(language);
  const setField=(field,value)=>setDraft(old=>({...old,[field]:value}));
  const costChange=(field,value)=>setDraft(old=>{const next={...old,[field]:value};next.production_cost=String((Number(next.material_cost)||0)+(Number(next.labour_cost)||0));return next});
  const fieldVoice=(field,label,value,renderInput,onResult)=><FieldVoiceInput field={field} label={label} value={value} onChange={onResult|| (answer=>setField(field,answer))} language={language} onSpeak={onSpeak} onTranscribe={onTranscribe} voiceSessionRef={voiceSessionRef} onActiveChange={onActiveChange} renderInput={renderInput} />;
  const categories=[['Pottery',ui.catPottery],['Textiles',ui.catTextiles],['Home Decor',ui.catHome],['Woodwork',ui.catWood],['Jewellery',ui.catJewellery],['Other',ui.catOther]];
  const setCategoryAnswer=answer=>{const value=String(answer||'').toLowerCase();const match=categories.find(([item])=>value.includes(item.toLowerCase())||(item==='Pottery'&&/clay|ceramic|potter|மட்பாண்டம்|मिट्टी|മൺപാത്രം/.test(value))||(item==='Textiles'&&/cloth|fabric|weav|textile|துணி|कपड़ा|തുണി/.test(value))||(item==='Home Decor'&&/decor|home|வீட்டு அலங்காரம்|सजावट|അലങ്കാരം/.test(value))||(item==='Woodwork'&&/wood|carv|மரவேலை|लकड़ी|മരപ്പണി/.test(value))||(item==='Jewellery'&&/jewel|ornament|நகை|आभूषण|ആഭരണം/.test(value)));setField('category',match?.[0]||'Other');};
  const continueToCatalog=()=>{
    if(!sourcePhoto){setValidationError(ui.validationPhoto);return}
    if(!draft.name.trim()){setValidationError(ui.validationName);return}
    if(!draft.category){setValidationError(ui.validationCategory);return}
    if(!draft.price||Number(draft.price)<=0){setValidationError(ui.validationPrice);return}
    if(draft.stock===''||Number(draft.stock)<0||!Number.isInteger(Number(draft.stock))){setValidationError(ui.validationStock);return}
    if(voiceActive){setValidationError(ui.validationVoice);return}
    setValidationError('');onContinue?.();
  };
  return <div className="form-content add-product-flow" lang={language} dir="auto">{stepper(1,ui)}<div className="form-card"><div className="form-heading"><small>{ui.addEyebrow}</small><h2>{ui.addTitle}</h2><p>{ui.addSubtitle}</p></div>
    <section className="add-product-section"><h3>{ui.photoTitle} <i>{ui.required}</i></h3><p>{ui.photoHint}</p><ProductPhoto photo={photo} setPhoto={setPhoto} sourcePhoto={sourcePhoto} setSourcePhoto={setSourcePhoto} onImageReady={onImageReady} onRemoveBackground={onRemoveBackground} onStatus={onStatus} ui={ui} appUi={appUi}/></section>
    <section className="add-product-section"><h3>{ui.detailsTitle}</h3><div className="add-product-fields">
      <label className="field-label">{ui.name} <i>{ui.required}</i>{fieldVoice('name',ui.name,draft.name)}</label>
      <label className="field-label">{ui.category} <i>{ui.required}</i>{fieldVoice('category',ui.category,draft.category,({value,onChange})=><select aria-label={ui.category} value={value} onChange={event=>onChange(event.target.value)}><option value="">{ui.chooseCategory}</option>{categories.map(([item,label])=><option key={item} value={item}>{label}</option>)}</select>,setCategoryAnswer)}</label>
      <label className="field-label">{ui.material}{fieldVoice('material',ui.material,draft.material)}</label>
      <label className="field-label">{ui.color}{fieldVoice('color',ui.color,draft.color)}</label>
      <label className="field-label">{ui.size}{fieldVoice('size',ui.size,draft.size)}</label>
      <label className="field-label">{ui.makingTime}{fieldVoice('production_time',ui.makingTime,draft.production_time)}</label>
      <label className="field-label">{ui.technique}<input value={draft.making_method||''} onChange={event=>setField('making_method',event.target.value)} placeholder={ui.techniqueHint}/></label>
    </div></section>
    <section className="add-product-section"><h3>{ui.priceTitle}</h3><div className="add-product-fields price-stock-grid">
      <label className="field-label">{ui.yourPrice} <i>{ui.required}</i><div className="currency-input"><span>₹</span><input type="number" min="1" value={draft.price} onChange={event=>setField('price',event.target.value)} placeholder={ui.enterPrice}/></div><small>{ui.choosePrice}</small></label>
      <label className="field-label">{ui.stock} <i>{ui.required}</i><input type="number" min="0" step="1" value={draft.stock} onChange={event=>setField('stock',event.target.value)} placeholder={ui.stockHint}/></label>
      <label className="field-label">{ui.materialCost}<input type="number" min="0" value={draft.material_cost||''} onChange={event=>costChange('material_cost',event.target.value)} placeholder={ui.actualCost}/></label>
      <label className="field-label">{ui.labourCost}<input type="number" min="0" value={draft.labour_cost||''} onChange={event=>costChange('labour_cost',event.target.value)} placeholder={ui.actualCost}/></label>
    </div><button type="button" className="button-secondary suggest-price-button" onClick={onSuggestPricing} disabled={!draft.category}>{ui.suggestPrice}</button>
    {draft.suggestedLow&&<div className="analysis-card suggested-price-card"><div><span>{ui.aiSuggestedPrice} · {ui.suggestedRange}</span><b>₹{Number(draft.suggestedLow).toLocaleString('en-IN')}–₹{Number(draft.suggestedHigh).toLocaleString('en-IN')}</b><small>{draft.priceExplanation||ui.choosePrice}</small></div><div><strong>{ui.aiSuggestedPrice}: ₹{Number(draft.suggestedPrice).toLocaleString('en-IN')}</strong><button type="button" className="button-primary" onClick={()=>setField('price',String(draft.suggestedPrice))}>{ui.useSuggested}</button></div></div>}</section>
    <section className="add-product-section"><h3>{ui.storyTitle}</h3><p>{ui.storyHint}</p><FieldVoiceInput field="description" label={ui.productStory} value={draft.description} onChange={answer=>setField('description',answer)} language={language} onSpeak={onSpeak} onTranscribe={onTranscribe} voiceSessionRef={voiceSessionRef} onActiveChange={onActiveChange} renderInput={({value,onChange})=><textarea rows="5" value={value} onChange={event=>onChange(event.target.value)} aria-label={ui.productStory} placeholder={ui.storyPlaceholder}/>}/></section>
    <label className="field-label listing-status-field">{ui.listingStatus}<select value={draft.status||'Active'} onChange={event=>setField('status',event.target.value)}><option value="Active">{ui.active}</option><option value="Draft">{ui.draft}</option></select><small>{ui.statusHint}</small></label>
    {validationError&&<p className="form-validation-message" role="alert">{validationError}</p>}
    <div className="form-actions"><button type="button" className="button-primary continue-catalog-button" disabled={catalogBusy||voiceActive} onClick={continueToCatalog}>{catalogBusy?ui.creating:ui.continue} <span>→</span></button></div>
  </div></div>;
}

export function ProductVoiceForm({ draft, setDraft, photo, sourcePhoto, transcript, language='en-IN', catalogBusy, catalogAnalyzed, catalogDemo, catalogDemoText, visualAnalysisLabel, catalogError, onStatus, onSpeak, onGenerateCatalog, onBack, onContinue }) {
  const ui=getArtisanCopy(language);
  const [speaking,setSpeaking]=React.useState('');
  const [catalogMessage,setCatalogMessage]=React.useState('');
  const speechSeq=React.useRef(0), audioRef=React.useRef(null), audioUrlRef=React.useRef('');
  const stopSpeech=()=>{speechSeq.current+=1;window.speechSynthesis?.cancel();if(audioRef.current){audioRef.current.pause();audioRef.current=null}if(audioUrlRef.current){URL.revokeObjectURL(audioUrlRef.current);audioUrlRef.current=''}setSpeaking('')};
  React.useEffect(()=>()=>{speechSeq.current+=1;window.speechSynthesis?.cancel();audioRef.current?.pause();if(audioUrlRef.current)URL.revokeObjectURL(audioUrlRef.current)},[]);
  const speakDescription=async(language)=>{
    const locale=language==='hi'?'hi-IN':'en-IN';
    const features=language==='hi'?(draft.features_hi||[]):(draft.features_en||[]);
    const text=language==='hi'
      ? [draft.product_name_hi,draft.description_hi,...features].filter(item=>String(item||'').trim()).join('. ')
      : [draft.name,draft.description_en,...features,draft.category&&`Category: ${draft.category}`,draft.material&&`Material: ${draft.material}`,draft.color&&`Color: ${draft.color}`,draft.size&&`Size: ${draft.size}`,draft.suggested_uses&&`Suggested uses: ${draft.suggested_uses}`,draft.craft_information&&`Craft information: ${draft.craft_information}`].filter(item=>String(item||'').trim()).join('. ');
    if(!text?.trim()){onStatus(ui.analysisFailed);return}
    stopSpeech();const seq=speechSeq.current;setSpeaking(language);
    const finish=()=>{if(seq===speechSeq.current)setSpeaking('')};
    const speakWithService=async()=>{
      try{if(!onSpeak)throw new Error('speech unavailable');const blob=await onSpeak(text,locale);if(seq!==speechSeq.current)return;const url=URL.createObjectURL(blob);audioUrlRef.current=url;const audio=new Audio(url);audioRef.current=audio;audio.onended=()=>{if(audioUrlRef.current===url){URL.revokeObjectURL(url);audioUrlRef.current=''}audioRef.current=null;finish()};audio.onerror=()=>{if(audioUrlRef.current===url){URL.revokeObjectURL(url);audioUrlRef.current=''}audioRef.current=null;playLocal()};await audio.play()}
      catch{if(seq===speechSeq.current)playLocal()}
    };
    const playLocal=async()=>{if(seq!==speechSeq.current)return;if(!window.speechSynthesis||!window.SpeechSynthesisUtterance){finish();onStatus(ui.voiceUnavailableRead);return}let voices=window.speechSynthesis.getVoices();if(!voices.length)voices=await new Promise(resolve=>{let settled=false;const done=()=>{if(settled)return;settled=true;window.clearTimeout(timer);window.speechSynthesis.removeEventListener?.('voiceschanged',changed);resolve(window.speechSynthesis.getVoices())};const changed=()=>{if(window.speechSynthesis.getVoices().length)done()};const timer=window.setTimeout(done,1800);window.speechSynthesis.addEventListener?.('voiceschanged',changed)});if(seq!==speechSeq.current)return;const voice=voices.find(item=>item.lang?.toLowerCase()===locale.toLowerCase())||voices.find(item=>item.lang?.toLowerCase().startsWith(`${locale.split('-')[0].toLowerCase()}-`));if(!voice){finish();onStatus(ui.voiceUnavailableRead);return}const utterance=new SpeechSynthesisUtterance(text);utterance.lang=locale;utterance.voice=voice;utterance.onend=finish;utterance.onerror=()=>{finish();onStatus(ui.voiceUnavailableRead)};window.speechSynthesis.speak(utterance)};
    // Prefer the configured AI speech service so the requested catalog language is read naturally.
    // Browser speech is a local fallback only when the service is unavailable.
    await speakWithService();
  };
  const prepareBilingual=async(replaceDescriptions=false)=>{if(!photo&&!sourcePhoto){setCatalogMessage(ui.validationPhoto);return}setCatalogMessage('');const result=await onGenerateCatalog({replaceDescriptions});setCatalogMessage(result?.demoGenerated?catalogDemoText:result?ui.analyzed:ui.aiUnavailable);};
  const continueToReview=()=>{if(!photo&&!sourcePhoto){setCatalogMessage(ui.validationPhoto);return}onContinue();};
  return <div className="form-content add-product-flow" lang={language} dir="auto">{stepper(2,ui)}<div className="form-card"><div className="form-heading"><small>{ui.stepCatalog}</small><h2>{ui.catalogTitle}</h2><p>{ui.catalogSubtitle}</p></div>
    <section className="catalog-image-card"><b>{ui.catalogImage}</b>{photo||sourcePhoto?<img src={photo||sourcePhoto} alt={ui.catalogImage}/>:<p>{ui.validationPhoto}</p>}</section>
    <div className="catalog-analysis-status" role="status"><b>{catalogBusy?ui.analysisBusy:catalogError||(catalogAnalyzed?ui.analyzed:(draft.description_en&&draft.description_hi?ui.catalogManualHint:ui.analysisFailed))}</b>{catalogBusy&&<span className="catalog-loading-dot"/>}</div>
    {catalogDemo&&<p className="catalog-message" role="note">{catalogDemoText}</p>}
    {draft.visual_analysis?.confidence_notes&&<p className="translation-note" role="note"><b>{visualAnalysisLabel||ui.catalogManualHint}:</b> {draft.visual_analysis.confidence_notes}</p>}
    {catalogError&&<p className="catalog-message" role="alert">{catalogError}</p>}
    {transcript&&<div className="catalog-transcript"><b>{ui.detailsShared}</b><p dir="auto">{transcript}</p></div>}
    <div className="catalog-edit-basics"><label className="field-label">{ui.name}<input aria-label={ui.name} value={draft.name||''} onChange={e=>setDraft(old=>({...old,name:e.target.value}))}/></label><label className="field-label">{ui.category}<input aria-label={ui.category} value={draft.category||''} onChange={e=>setDraft(old=>({...old,category:e.target.value}))}/></label><label className="field-label">{ui.material}<input aria-label={ui.material} value={draft.material||''} onChange={e=>setDraft(old=>({...old,material:e.target.value}))}/></label><label className="field-label">{ui.color}<input aria-label={ui.color} value={draft.color||''} onChange={e=>setDraft(old=>({...old,color:e.target.value}))}/></label><label className="field-label">{ui.size}<input aria-label={ui.size} value={draft.size||''} onChange={e=>setDraft(old=>({...old,size:e.target.value}))}/></label><label className="field-label">{ui.makingTime}<input aria-label={ui.makingTime} value={draft.production_time||''} onChange={e=>setDraft(old=>({...old,production_time:e.target.value}))}/></label></div>
    <label className="field-label">{ui.storyPrompt}<textarea rows="4" value={draft.description} onChange={e=>setDraft({...draft,description:e.target.value})} placeholder={ui.storyForBuyers}/></label>
    <div className="bilingual-heading"><div><small>{ui.generatedCatalog}</small><b>{ui.english} & {ui.hindi}</b></div><button type="button" className="button-secondary" onClick={()=>prepareBilingual(true)} disabled={catalogBusy}>{catalogBusy?ui.regenerating:ui.regenerate}</button></div>
    {catalogMessage&&<p className="catalog-message" role="status">{catalogMessage}</p>}
    <div className="bilingual-edit-grid"><label className="field-label"><span>{ui.english} <small>🇮🇳 en-IN</small></span><textarea rows="5" value={draft.description_en||''} onChange={e=>setDraft({...draft,description_en:e.target.value})} placeholder={ui.productDescription}/><small>{ui.features}</small><textarea rows="3" value={(draft.features_en||[]).join('\n')} onChange={e=>setDraft({...draft,features_en:e.target.value.split('\n').filter(item=>item.trim())})} placeholder={ui.features}/>{draft.description_en&&<div className="speech-controls"><button type="button" onClick={()=>speakDescription('en')}>{ui.listenEnglish}</button>{speaking==='en'&&<><span>{ui.playingEnglish}</span><button type="button" onClick={stopSpeech}>{ui.stop}</button></>}</div>}</label><label className="field-label"><span>{ui.hindi} <small>हिं hi-IN</small></span><small>{ui.hindiName}</small><input lang="hi" dir="auto" value={draft.product_name_hi||''} onChange={e=>setDraft({...draft,product_name_hi:e.target.value})} placeholder={ui.hindiName}/><small>{ui.hindiDescription}</small><textarea rows="5" dir="auto" lang="hi" value={draft.description_hi||''} onChange={e=>setDraft({...draft,description_hi:e.target.value})} placeholder={ui.hindiDescription}/><small>{ui.hindiFeatures}</small><textarea rows="3" dir="auto" lang="hi" value={(draft.features_hi||[]).join('\n')} onChange={e=>setDraft({...draft,features_hi:e.target.value.split('\n').filter(item=>item.trim())})} placeholder={ui.hindiFeatures}/>{draft.description_hi&&<div className="speech-controls"><button type="button" onClick={()=>speakDescription('hi')}>{ui.listenHindi}</button>{speaking==='hi'&&<><span>{ui.playingHindi}</span><button type="button" onClick={stopSpeech}>{ui.stop}</button></>}</div>}</label></div>
    <p className="translation-note">{ui.catalogManualHint}</p>
    <div className="form-actions split"><button className="button-secondary" onClick={onBack}>← {ui.back}</button><button className="button-primary" onClick={continueToReview} disabled={catalogBusy}>{ui.useListing} →</button></div>
  </div></div>;
}

export function ProductReviewForm({ draft, photo, language='en-IN', editing, onBack, onPublish }) {
  const ui=getArtisanCopy(language);
  const [photoReviewOpen,setPhotoReviewOpen]=React.useState(false);
  return <div className="form-content add-product-flow" lang={language} dir="auto">{stepper(3,ui)}<div className="form-card"><div className="form-heading"><small>{ui.stepReview}</small><h2>{ui.reviewTitle}</h2><p>{ui.reviewSubtitle}</p></div>
    <div className="analysis-card"><div><span>✦ {draft.suggestionSource||ui.priceEstimate}</span><b>{draft.suggestedLow?`₹${Number(draft.suggestedLow).toLocaleString('en-IN')}–₹${Number(draft.suggestedHigh).toLocaleString('en-IN')}`:`₹${Number(draft.suggestedPrice||draft.price||0).toLocaleString('en-IN')}`}</b><small>{draft.priceExplanation||ui.choosePrice}</small></div><span className="trend-badge">{ui.yourPriceLabel}: ₹ {Number(draft.price||0).toLocaleString('en-IN')}</span></div>
    <div className="review-product"><button type="button" className="review-art review-art-button" onClick={()=>photo&&setPhotoReviewOpen(true)} disabled={!photo} aria-label={ui.marketplacePhoto}>{photo?<img src={photo} alt={draft.name||ui.name}/>:<span>🏺</span>}</button><div><small>{draft.category}</small><h3>{draft.name||ui.name}</h3><b>₹ {Number(draft.price||0).toLocaleString('en-IN')}</b><span>{ui.stockLabel}: {draft.stock??'—'}</span>{draft.material&&<span>{ui.materialLabel}: {draft.material}</span>}{draft.color&&<span>{ui.colorLabel}: {draft.color}</span>}{draft.size&&<span>{ui.sizeLabel}: {draft.size}</span>}{draft.production_time&&<span>{ui.makingTimeLabel}: {draft.production_time}</span>}{draft.material_cost>0&&<span>{ui.materialCostLabel}: ₹{Number(draft.material_cost).toLocaleString('en-IN')}</span>}{draft.labour_cost>0&&<span>{ui.labourCostLabel}: ₹{Number(draft.labour_cost).toLocaleString('en-IN')}</span>}</div></div>
    {photoReviewOpen&&<div className="photo-review-backdrop" role="presentation" onClick={()=>setPhotoReviewOpen(false)}><section className="photo-review-dialog listing-photo-dialog" role="dialog" aria-modal="true" aria-labelledby="listing-photo-title" onClick={event=>event.stopPropagation()}><button type="button" className="photo-review-close" onClick={()=>setPhotoReviewOpen(false)} aria-label={ui.done}>×</button><h2 id="listing-photo-title">{ui.marketplacePhoto}</h2><p>{ui.photoHelp}</p><img className="listing-photo-large" src={photo} alt={`${draft.name||'Product'} listing image on a white background`}/><button type="button" className="button-primary" onClick={()=>setPhotoReviewOpen(false)}>{ui.done}</button></section></div>}
    {draft.keywords?.length>0&&<div className="product-tags catalog-keywords">{draft.keywords.map(keyword=><span key={keyword}>{keyword}</span>)}</div>}
    {draft.style&&<p><b>{ui.styleLabel}:</b> {draft.style}</p>}{draft.suggested_uses&&<p><b>{ui.usesLabel}:</b> {draft.suggested_uses}</p>}{draft.craft_information&&<p><b>{ui.craftInfoLabel}:</b> {draft.craft_information}</p>}
    {draft.description&&<section className="artisan-story-preview"><h3>{ui.productStory}</h3><p>{draft.description}</p></section>}
    <div className="bilingual-preview"><h3>{ui.english} {ui.productDescription}</h3><p>{draft.description_en||ui.catalogManualHint}</p>{draft.features_en?.length>0&&<ul>{draft.features_en.map((feature,index)=><li key={`${index}-${feature}`}>{feature}</li>)}</ul>}<h3 lang="hi">{draft.product_name_hi||ui.hindiName}</h3><p lang="hi" dir="auto">{draft.description_hi||ui.hindiDescription}</p>{draft.features_hi?.length>0&&<ul lang="hi" dir="auto">{draft.features_hi.map((feature,index)=><li key={`${index}-${feature}`}>{feature}</li>)}</ul>}</div>
    <div className="form-actions split"><button className="button-secondary" onClick={onBack}>← {ui.back}</button><button className="button-primary" onClick={onPublish}>{editing?ui.saveChanges:draft.status==='Draft'?ui.saveDraft:ui.publish}</button></div>
  </div></div>;
}
