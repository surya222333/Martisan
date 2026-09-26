import React, { useEffect, useRef, useState } from 'react';

const speechLanguages = [
  ['en-IN', 'English'], ['hi-IN', 'Hindi'], ['ta-IN', 'Tamil'], ['ml-IN', 'Malayalam'],
];
const interviewQuestions = {
  en: [
    ['name', 'What is the name of your product?'],
    ['category', 'What kind of product is it? For example, pottery, textiles, home decor, woodwork, or jewellery.'],
    ['price', 'What price in rupees would you like to set?'],
    ['stock', 'How many pieces are available in stock?'],
    ['description', 'Tell me how you made this product, which materials you used, and any special techniques or traditions behind it.'],
  ],
  hi: [
    ['name', 'आपके उत्पाद का नाम क्या है?'],
    ['category', 'यह किस प्रकार का उत्पाद है? जैसे मिट्टी के बर्तन, कपड़ा, घर की सजावट, लकड़ी का काम या आभूषण।'],
    ['price', 'आप इसकी कीमत कितने रुपये रखना चाहते हैं?'],
    ['stock', 'आपके पास कितने उत्पाद उपलब्ध हैं?'],
    ['description', 'बताइए कि आपने यह उत्पाद कैसे बनाया, इसमें कौन-सी सामग्री इस्तेमाल की, और इसमें कौन-सी खास तकनीक या परंपरा जुड़ी है।'],
  ],
  ta: [
    ['name', 'உங்கள் பொருளின் பெயர் என்ன?'],
    ['category', 'இது எந்த வகைப் பொருள்? மட்பாண்டம், துணி, வீட்டு அலங்காரம், மரவேலை அல்லது நகை போன்றவற்றில் எது?'],
    ['price', 'இதற்கு எத்தனை ரூபாய் விலை வைக்க விரும்புகிறீர்கள்?'],
    ['stock', 'கையிருப்பில் எத்தனை பொருட்கள் உள்ளன?'],
    ['description', 'இந்தப் பொருளை எப்படி செய்தீர்கள், எந்தப் பொருட்களைப் பயன்படுத்தினீர்கள், இதில் என்ன சிறப்பு நுட்பம் அல்லது பாரம்பரியம் உள்ளது என்று சொல்லுங்கள்.'],
  ],
  ml: [
    ['name', 'നിങ്ങളുടെ ഉൽപ്പന്നത്തിന്റെ പേര് എന്താണ്?'],
    ['category', 'ഇത് ഏത് വിഭാഗത്തിലുള്ള ഉൽപ്പന്നമാണ്? മൺപാത്രം, തുണിത്തരങ്ങൾ, വീട്ടലങ്കാരം, മരപ്പണി, ആഭരണം എന്നിവയിൽ ഏത്?'],
    ['price', 'ഇതിന് എത്ര രൂപ വില നിശ്ചയിക്കണം?'],
    ['stock', 'സ്റ്റോക്കിൽ എത്ര എണ്ണം ലഭ്യമാണ്?'],
    ['description', 'ഈ ഉൽപ്പന്നം എങ്ങനെ നിർമ്മിച്ചു, ഏത് വസ്തുക്കൾ ഉപയോഗിച്ചു, പ്രത്യേക രീതിയോ പാരമ്പര്യമോ ഉണ്ടെങ്കിൽ അതും പറയൂ.'],
  ],
};
const answerLabels = { name: 'Product name', category: 'Category', price: 'Price', stock: 'Stock', description: 'Product story' };

export function VoiceAssistant({ onSpeak, onTranscribe, onAnswer, onComplete, onActiveChange }) {
  const [language, setLanguage] = useState('');
  const [active, setActive] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [questionText, setQuestionText] = useState('Choose your language to begin.');
  const [status, setStatus] = useState('First choose your language. Then tap the microphone to answer each question.');
  const [answers, setAnswers] = useState({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const recorderRef = useRef(null);
  const speechAudioRef = useRef(null);
  const speechUrlRef = useRef('');
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const animationRef = useRef(null);
  const chunksRef = useRef([]);
  const answersRef = useRef({});
  const cancelledRef = useRef(false);
  const languageRef = useRef(language);
  const activeRef = useRef(false);
  const questions = interviewQuestions[language.split('-')[0]] || interviewQuestions.en;
  const cleanup = () => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    animationRef.current = null;
    try { if (recorderRef.current?.state === 'recording') recorderRef.current.stop(); } catch { /* Recorder may already be stopped. */ }
    try { audioContextRef.current?.close(); } catch { /* Audio context may already be closed. */ }
    audioContextRef.current = null;
    streamRef.current?.getTracks().forEach(track => track.stop());
    streamRef.current = null;
    if (speechAudioRef.current) { speechAudioRef.current.pause(); speechAudioRef.current = null; }
    if (speechUrlRef.current) { URL.revokeObjectURL(speechUrlRef.current); speechUrlRef.current = ''; }
  };
  const setSessionActive = value => { activeRef.current = value; setActive(value); onActiveChange?.(value); };
  useEffect(() => { languageRef.current = language; }, [language]);
  useEffect(() => () => {
    cancelledRef.current = true;
    try { recorderRef.current?.stop(); } catch { /* Recorder may already be stopped. */ }
    cleanup();
  }, []);

  const speakOnDevice = text => new Promise((resolve, reject) => {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) { reject(new Error('Device speech is unavailable.')); return; }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = languageRef.current;
    utterance.rate = 0.88;
    let finished = false;
    const timer = window.setTimeout(() => { if (!finished) { finished = true; reject(new Error('Device speech timed out.')); } }, 12000);
    utterance.onend = () => { if (!finished) { finished = true; clearTimeout(timer); resolve(); } };
    utterance.onerror = () => { if (!finished) { finished = true; clearTimeout(timer); reject(new Error('Device speech failed.')); } };
    window.speechSynthesis.speak(utterance);
  });

  const speak = async text => {
    setQuestionText(text);
    try {
      if (!onSpeak) throw new Error('Spoken questions are unavailable.');
      if (speechUrlRef.current) URL.revokeObjectURL(speechUrlRef.current);
      const blob = await onSpeak(text, languageRef.current);
      if (cancelledRef.current || !activeRef.current) return;
      const url = URL.createObjectURL(blob);
      speechUrlRef.current = url;
      await new Promise((resolve, reject) => {
        const audio = new Audio(url);
        speechAudioRef.current = audio;
        audio.onended = resolve;
        audio.onerror = () => reject(new Error('Unable to play the spoken question.'));
        audio.play().catch(reject);
      });
      speechAudioRef.current = null;
    } catch (error) {
      if (cancelledRef.current || !activeRef.current) return;
      try { await speakOnDevice(text); }
      catch { throw error; }
    }
  };

  const askAndRecord = async index => {
    if (!activeRef.current || cancelledRef.current) return;
    if (index >= questions.length) {
      setStatus('All five answers are captured. Preparing your catalog…');
      setRecording(false);
      setTranscribing(true);
      cleanup();
      const generated=await onComplete?.(answersRef.current);
      setTranscribing(false);
      setSessionActive(false);
      setStatus(generated?'Interview complete. Review the captured details below.':'Answers saved. Add OPENAI_API_KEY in backend/.env to generate catalog suggestions.');
      return;
    }
    setQuestionIndex(index);
    const [field, prompt] = questions[index];
    await speak(prompt);
    if (!activeRef.current || cancelledRef.current) return;
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      audioContextRef.current = context;
      await context.resume();
      const analyser = context.createAnalyser();
      analyser.fftSize = 512;
      context.createMediaStreamSource(streamRef.current).connect(analyser);
      const mimeType = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported?.(type));
      const recorder = mimeType ? new MediaRecorder(streamRef.current, { mimeType }) : new MediaRecorder(streamRef.current);
      recorderRef.current = recorder;
      chunksRef.current = [];
      recorder.ondataavailable = event => { if (event.data?.size) chunksRef.current.push(event.data); };
      recorder.onerror = () => { setStatus('Unable to record audio. Tap the microphone to try again.'); };
      recorder.onstop = async () => {
        setRecording(false);
        if (cancelledRef.current || !activeRef.current) return;
        try { await audioContextRef.current?.close(); } catch { /* Audio context may already be closed. */ }
        audioContextRef.current = null;
        const audio = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (!audio.size) { setStatus('I didn’t hear an answer. Tap the microphone to try again.'); setSessionActive(false); cleanup(); return; }
        setTranscribing(true);
        setStatus(`Converting your ${speechLanguages.find(([code]) => code === languageRef.current)?.[1] || ''} answer to English…`);
        try {
          const result = await onTranscribe(audio, languageRef.current);
          const answer = String(result?.transcript || '').trim();
          if (!answer) throw new Error('Unable to transcribe the voice input. Please try again.');
          const accepted = await onAnswer?.(answer, field);
          if (accepted === false) {
            setTranscribing(false);
            setStatus(`I couldn’t understand the ${answerLabels[field].toLowerCase()}. I’ll ask again; please answer clearly.`);
            await askAndRecord(index);
            return;
          }
          const updated = { ...answersRef.current, [field]: answer };
          answersRef.current = updated;
          setAnswers(updated);
          setStatus(`Captured ${answerLabels[field]}. Next question coming up…`);
          setTranscribing(false);
          await askAndRecord(index + 1);
        } catch (error) {
          setTranscribing(false);
          setStatus(error?.message?.includes('OPENAI_API_KEY') ? error.message : error?.message || 'Unable to transcribe the voice input. Please try again.');
          setSessionActive(false);
          cleanup();
        }
      };
      recorder.start(250);
      setRecording(true);
      setStatus(`Listening for your answer to: ${answerLabels[field]}. Pause when you are done.`);
      const samples = new Uint8Array(analyser.fftSize);
      const startedAt = Date.now();
      let heardSpeech = false;
      let lastSoundAt = startedAt;
      const detectSilence = () => {
        if (recorder.state !== 'recording') return;
        analyser.getByteTimeDomainData(samples);
        const level = Math.sqrt(samples.reduce((sum, sample) => sum + (sample - 128) ** 2, 0) / samples.length);
        const now = Date.now();
        if (level > 3.5) { heardSpeech = true; lastSoundAt = now; }
        if ((heardSpeech && now - lastSoundAt > 2400) || (!heardSpeech && now - startedAt > 15000) || now - startedAt > 60000) { recorder.stop(); return; }
        animationRef.current = requestAnimationFrame(detectSilence);
      };
      animationRef.current = requestAnimationFrame(detectSilence);
    } catch (error) {
      setStatus(error?.message?.includes('OPENAI_API_KEY') ? error.message : error?.message || 'Unable to record audio. Check microphone access and try again.');
      setSessionActive(false);
      cleanup();
    }
  };

  const start = async () => {
    if (activeRef.current) {
      if (recording && recorderRef.current?.state === 'recording') { recorderRef.current.stop(); return; }
      cancelledRef.current = true;
      speechAudioRef.current?.pause();
      setStatus('Voice interview stopped. Tap the microphone to start again.');
      setSessionActive(false);
      cleanup();
      return;
    }
    if (!language) { setStatus('Choose a language before starting the voice assistant.'); return; }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setStatus('Microphone recording is unavailable here. Open this app in Chrome or Edge.'); return; }
    cancelledRef.current = false;
    if (questionIndex >= questions.length) { answersRef.current = {}; setAnswers({}); setQuestionIndex(0); }
    setSessionActive(true);
    setStatus('Requesting microphone access…');
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      await askAndRecord(questionIndex >= questions.length ? 0 : questionIndex);
    } catch (error) {
      cleanup();
      setSessionActive(false);
      setStatus(error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError' ? 'Microphone permission is required to use the voice assistant.' : 'Unable to start the microphone. Please try again.');
    }
  };

  return <section className="voice-assistant">
    <div className="voice-assistant-head"><span>✦</span><div><b>AI voice assistant</b><small>Answer five questions to fill in your product details</small></div></div>
    <div className="voice-controls interview-controls">
      <label>Choose your language<select aria-label="Assistant language" value={language} onChange={e=>{setLanguage(e.target.value);setQuestionText(e.target.value?'Ready. Tap the microphone to start.':'Choose your language to begin.')}} disabled={active}><option value="" disabled>Select language</option>{speechLanguages.map(([code,name])=><option value={code} key={code}>{name}</option>)}</select></label>
      <button type="button" className={`voice-listen ${recording?'is-listening':''}`} onClick={start} disabled={transcribing||!language&&!active} aria-label={active?(recording?'Finish answer':'Stop interview'):'Start voice assistant'}>
        <span>{recording?'■':'🎙'}</span>{active?(recording?'Done':'Stop'):answers[questions[questions.length-1][0]]?'Start again':'Start interview'}
      </button>
    </div>
    <div className="voice-question" lang={language} dir={language.startsWith('en')?'ltr':'auto'} aria-live="polite">{questionText}</div>
    <small className={`voice-status ${recording||transcribing?'is-listening':''}`} aria-live="polite">{status}</small>
    <div className="voice-transcript" aria-live="polite"><b>English answers</b>{Object.keys(answers).length?Object.entries(answers).map(([field,answer])=><p key={field}><strong>{answerLabels[field]}:</strong> {answer}</p>):<p>Your answers will appear here in English.</p>}</div>
  </section>;
}
function compactImage(file) {
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file); const image=new Image();
    image.onload=()=>{try{const scale=Math.min(1,1600/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/webp',.9));}catch(error){reject(error)}finally{URL.revokeObjectURL(url)}};
    image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read this image.'))};image.src=url;
  });
}

export function ProductPhoto({ photo, setPhoto, sourcePhoto, setSourcePhoto, onStatus, onAnalyzeImage, onRemoveBackground }) {
  const [busy,setBusy]=useState(false);
  const [analyzing,setAnalyzing]=useState(false);
  const [catalogFailed,setCatalogFailed]=useState(false);
  const [error,setError]=useState('');
  const [reviewOpen,setReviewOpen]=useState(false);
  const inputRef=useRef(null);
  const cameraInputRef=useRef(null);
  const sourceFileRef=useRef(null);
  const generate=async(file=sourceFileRef.current)=>{
    if(!file&&!sourcePhoto)return;
    setBusy(true);setError('');
    try{
      let inputFile=file;
      if(!inputFile){const response=await fetch(sourcePhoto);const blob=await response.blob();inputFile=new File([blob],'artisan-product.webp',{type:blob.type||'image/webp'});}
      const result=await onRemoveBackground(inputFile);
      if(!result?.photo)throw new Error('No transparent image was returned.');
      setPhoto(result.photo);onStatus('Background removed. The product is brightened on white.');
      return result;
    }
    catch(error){setError(error?.message||'Background removal failed. Please try again.');}
    finally{setBusy(false)}
  };
  const analyze=async(file,cleanedPhoto=photo)=>{
    if(!onAnalyzeImage||!cleanedPhoto)return;
    setAnalyzing(true);setCatalogFailed(false);
    try{
      const result=await onAnalyzeImage(file,cleanedPhoto);
      if(!result){setCatalogFailed(true);setError('The cleaned photo is ready, but catalog analysis failed. Your photo is safe. Check that the backend is running, then retry.');return}
      setError('');onStatus('Catalog suggestions are ready. Review the product name, category, description, and suggested price.');
    }catch(error){setCatalogFailed(true);setError(error?.message||'Catalog analysis failed. Your cleaned photo is safe; retry when the backend is available.')}
    finally{setAnalyzing(false)}
  };
  const choose=async event=>{
    const file=event.target.files?.[0]; if(!file)return;
    if(!file.type.startsWith('image/')){setError('Please choose an image file.');return}
    if(file.size>15*1024*1024){setError('Choose a photo smaller than 15 MB.');return}
    setBusy(true);setError('');
    try{const source=await compactImage(file);const compactBlob=await (await fetch(source)).blob();const optimizedFile=new File([compactBlob],'artisan-product.webp',{type:'image/webp'});sourceFileRef.current=optimizedFile;setSourcePhoto(source);setPhoto('');setCatalogFailed(false);const cleaned=await generate(optimizedFile);if(!cleaned?.photo)return;if(onAnalyzeImage)await analyze(optimizedFile,cleaned.photo)}
    catch(error){setError(error?.message||'Could not read this image. Try a JPG or PNG.');}
    finally{setBusy(false);event.target.value='';}
  };
  return <section className="photo-workbench" aria-label="Product photo preparation">
    <input ref={inputRef} className="photo-file-input" type="file" accept="image/png,image/jpeg,image/webp" onChange={choose}/>
    <input ref={cameraInputRef} className="photo-file-input" type="file" accept="image/*" capture="environment" onChange={choose}/>
    {sourcePhoto?<>
      <div className="photo-preview-grid">
        <figure><figcaption>Uploaded photo</figcaption><button type="button" className="photo-preview original-preview photo-preview-button" onClick={()=>setReviewOpen(true)} aria-label="Tap to review the uploaded photo"><img src={sourcePhoto} alt="Original product photo"/></button></figure>
        <figure><figcaption>Cleaned product on white</figcaption><button type="button" className="photo-preview result-preview photo-preview-button" onClick={()=>photo&&setReviewOpen(true)} disabled={!photo} aria-label="Tap to review the cleaned product photo">{photo?<img src={photo} alt="Cleaned and lightened product on a white background"/>:<span>{busy?'Preparing preview…':'Your cleaned preview appears here'}</span>}{busy&&<i className="photo-busy">Cleaning photo…</i>}</button></figure>
      </div>
      {photo&&<small className="photo-help">Tap either image to review it larger before you publish.</small>}
      <div className="photo-actions"><button type="button" className="button-secondary" onClick={()=>inputRef.current?.click()} disabled={busy||analyzing}>Upload another photo</button><button type="button" className="button-secondary" onClick={()=>cameraInputRef.current?.click()} disabled={busy||analyzing}>Use camera</button><button type="button" className="button-primary" onClick={()=>generate()} disabled={busy||analyzing}>{busy?'Preparing photo…':'↻ Clean photo again'}</button></div>
      {catalogFailed&&photo&&<button type="button" className="button-secondary catalog-retry" onClick={()=>analyze(sourceFileRef.current)} disabled={analyzing}>{analyzing?'Analyzing…':'↻ Retry catalog analysis'}</button>}
      <small className="photo-help">We remove the background, place the product on white, and brighten the photo before catalog analysis.</small>
      {analyzing&&<small className="photo-help" role="status">Analyzing the actual product image…</small>}
    </>:<div className="photo-empty"><b>{busy?'…':'＋'}</b><strong>{busy?'Preparing photo':'Add a product photo'}</strong><small>Upload a photo or use your camera. We’ll clean and brighten it, then analyze the product.</small><div className="photo-actions"><button type="button" className="button-secondary" onClick={()=>inputRef.current?.click()} disabled={busy}>Upload photo</button><button type="button" className="button-primary" onClick={()=>cameraInputRef.current?.click()} disabled={busy}>Use camera</button></div></div>}
    {reviewOpen&&<div className="photo-review-backdrop" role="presentation" onClick={()=>setReviewOpen(false)}><section className="photo-review-dialog" role="dialog" aria-modal="true" aria-labelledby="photo-review-title" onClick={event=>event.stopPropagation()}><button type="button" className="photo-review-close" onClick={()=>setReviewOpen(false)} aria-label="Close photo review">×</button><h2 id="photo-review-title">Review your product photo</h2><p>Check the original and the cleaned marketplace photo before continuing.</p><div className="photo-review-gallery"><figure><figcaption>Original</figcaption><img src={sourcePhoto} alt="Original uploaded product"/></figure><figure><figcaption>Cleaned on white</figcaption><img src={photo} alt="Background removed, brightened product on white"/></figure></div><button type="button" className="button-primary" onClick={()=>{setReviewOpen(false);onStatus('Photo reviewed. You can still replace or clean it again before publishing.')}}>Done reviewing</button></section></div>}
    {error&&<small className="photo-error" role="alert">{error}</small>}
  </section>;
}
