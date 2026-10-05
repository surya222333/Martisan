import React, { useEffect, useRef, useState } from 'react';
import { getArtisanCopy } from './artisan-i18n.js';

function compactImage(file) {
  return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file); const image=new Image();
    image.onload=()=>{try{const scale=Math.min(1,2048/Math.max(image.width,image.height));const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));const context=canvas.getContext('2d',{alpha:false});if(!context)throw new Error('This browser cannot process the product photo.');context.imageSmoothingQuality='high';context.drawImage(image,0,0,canvas.width,canvas.height);resolve(canvas.toDataURL('image/webp',.96));}catch(error){reject(error)}finally{URL.revokeObjectURL(url)}};
    image.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('Could not read this image.'))};image.src=url;
  });
}

const fieldQuestions = {
  name: ['What is the name of your product?', 'உங்கள் பொருளின் பெயர் என்ன?', 'आपके उत्पाद का नाम क्या है?', 'നിങ്ങളുടെ ഉൽപ്പന്നത്തിന്റെ പേര് എന്താണ്?'],
  category: ['What category does your product belong to?', 'உங்கள் பொருள் எந்த வகையைச் சேர்ந்தது?', 'आपका उत्पाद किस श्रेणी में आता है?', 'നിങ്ങളുടെ ഉൽപ്പന്നം ഏത് വിഭാഗത്തിൽപ്പെടുന്നു?'],
  material: ['What material is your product made from?', 'உங்கள் பொருள் எந்தப் பொருளால் செய்யப்பட்டது?', 'आपका उत्पाद किस सामग्री से बना है?', 'നിങ്ങളുടെ ഉൽപ്പന്നം ഏത് വസ്തുവിലാണ് നിർമ്മിച്ചിരിക്കുന്നത്?'],
  color: ['What is the main color of your product?', 'உங்கள் பொருளின் முக்கிய நிறம் என்ன?', 'आपके उत्पाद का मुख्य रंग क्या है?', 'നിങ്ങളുടെ ഉൽപ്പന്നത്തിന്റെ പ്രധാന നിറം എന്താണ്?'],
  size: ['What is the size or dimension of your product?', 'உங்கள் பொருளின் அளவு அல்லது பரிமாணம் என்ன?', 'आपके उत्पाद का आकार या माप क्या है?', 'നിങ്ങളുടെ ഉൽപ്പന്നത്തിന്റെ വലുപ്പമോ അളവോ എന്താണ്?'],
  production_time: ['How long does it take to make this product?', 'இந்தப் பொருளைச் செய்ய எவ்வளவு நேரம் ஆகும்?', 'इस उत्पाद को बनाने में कितना समय लगता है?', 'ഈ ഉൽപ്പന്നം നിർമ്മിക്കാൻ എത്ര സമയമെടുക്കും?'],
  description: ['Tell us about your product.', 'உங்கள் பொருளைப் பற்றி சொல்லுங்கள்.', 'हमें अपने उत्पाद के बारे में बताइए।', 'നിങ്ങളുടെ ഉൽപ്പന്നത്തെക്കുറിച്ച് പറയൂ.'],
};
const languageIndex = { 'en-IN': 0, 'ta-IN': 1, 'hi-IN': 2, 'ml-IN': 3 };

export function FieldVoiceInput({ field, label, value, onChange, language, onSpeak, onTranscribe, voiceSessionRef, onActiveChange, renderInput }) {
  const ui=getArtisanCopy(language);
  const [mode, setMode] = useState('manual');
  const [state, setState] = useState('idle');
  const [message, setMessage] = useState(ui.tapVoice);
  const mounted = useRef(true);
  const currentSession = useRef(null);
  const questionAudioRef = useRef(null);
  const question = fieldQuestions[field]?.[languageIndex[language] ?? 0] || fieldQuestions[field]?.[0] || '';

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      currentSession.current?.cancel?.();
    };
  }, []);

  const speakQuestion = async () => {
    try {
      const blob = await onSpeak(question, language);
      const url = URL.createObjectURL(blob);
      try {
        await new Promise((resolve, reject) => {
          questionAudioRef.current = new Audio(url);
          questionAudioRef.current.onended = resolve;
          questionAudioRef.current.onerror = () => reject(new Error('speech playback failed'));
          questionAudioRef.current.play().catch(reject);
        });
      } finally { URL.revokeObjectURL(url); }
    } catch {
      if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) throw new Error('Voice playback is unavailable. You can continue using Manual mode.');
      let availableVoices = window.speechSynthesis.getVoices();
      if (!availableVoices.length) availableVoices = await new Promise(resolve => {
        let settled = false;
        const done = () => { if (settled) return; settled = true; window.clearTimeout(timer); window.speechSynthesis.removeEventListener?.('voiceschanged', changed); resolve(window.speechSynthesis.getVoices()); };
        const changed = () => { if (window.speechSynthesis.getVoices().length) done(); };
        const timer = window.setTimeout(done, 1800);
        window.speechSynthesis.addEventListener?.('voiceschanged', changed);
      });
      await new Promise((resolve, reject) => {
        const utterance = new SpeechSynthesisUtterance(question);
        utterance.lang = language;
        utterance.rate = .88;
        const wanted = language.split('-')[0].toLowerCase();
        const exact = availableVoices.find(voice => voice.lang?.toLowerCase() === language.toLowerCase());
        const regional = availableVoices.find(voice => voice.lang?.toLowerCase().startsWith(`${wanted}-`));
        const matchingVoice = exact || regional || (wanted === 'en' ? availableVoices.find(voice => voice.lang?.toLowerCase().startsWith('en-')) : null);
        if (!matchingVoice) { reject(new Error(`No device voice is installed for ${language}.`)); return; }
        utterance.voice = matchingVoice;
        utterance.onend = resolve;
        utterance.onerror = () => reject(new Error('Voice playback is unavailable. You can continue using Manual mode.'));
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      });
    }
  };

  const start = async () => {
    voiceSessionRef.current?.cancel?.();
    let recorder, stream, audioContext, frame, recognition, recognitionRestartTimer, recognitionActive = false, browserTranscript = '', recognitionResultOffset = 0, recognitionResultCount = 0, acceptRecognition = false, cancelled = false, finishing = false;
    const chunks = [];
    const session = {
      finish: () => finish(),
      cancel: () => {
        cancelled = true;
        if (voiceSessionRef.current === session) voiceSessionRef.current = null;
        if (frame) cancelAnimationFrame(frame);
        try { if (recorder?.state === 'recording') recorder.stop(); } catch {}
        try { recognition?.abort?.(); } catch {}
        window.clearTimeout(recognitionRestartTimer);
        questionAudioRef.current?.pause(); questionAudioRef.current=null;
        window.speechSynthesis?.cancel();
        stream?.getTracks().forEach(track => track.stop());
        audioContext?.close().catch(() => {});
        if (mounted.current) { setState('idle'); setMessage(ui.tapVoice); onActiveChange(false); }
      },
    };
    voiceSessionRef.current = session;
    currentSession.current = session;
    onActiveChange(true);
    setMode('voice');
    setState('listening');
    setMessage(ui.requestingMic);

    const finish = () => {
      if (finishing || recorder?.state !== 'recording') return;
      finishing = true;
      if (frame) cancelAnimationFrame(frame);
      try { recognition?.stop?.(); } catch {}
      setState('processing');
      setMessage(ui.processing);
      recorder.stop();
    };

    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) throw new Error('Voice recording is unavailable in this browser. You can continue using Manual mode.');
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      if (cancelled) { stream.getTracks().forEach(track => track.stop()); return; }
      const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (Recognition) {
        try {
          recognition = new Recognition();
          recognition.lang = language;
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;
          recognition.onresult = event => {
            const results = Array.from(event.results || []);
            recognitionResultCount = results.length;
            if (!acceptRecognition) { recognitionResultOffset = recognitionResultCount; return; }
            const captured = results.slice(recognitionResultOffset);
            recognitionResultOffset = recognitionResultCount;
            const normalize = text => String(text || '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
            browserTranscript = captured.map(result => result?.[0]?.transcript || '').filter(text => normalize(text) && normalize(text) !== normalize(question)).join(' ').trim();
          };
          recognition.onstart = () => { recognitionActive = true; };
          recognition.onerror = event => console.warn('[Martisan voice] browser recognition fallback failed', { field, language, error: event.error });
          recognition.onend = () => {
            recognitionActive = false;
            if (acceptRecognition && !finishing && !cancelled && recorder?.state === 'recording') {
              recognitionRestartTimer = window.setTimeout(() => {
                try { if (!recognitionActive && recorder?.state === 'recording' && !finishing && !cancelled) recognition.start(); }
                catch (error) { console.warn('[Martisan voice] browser recognition restart failed', { field, language, error }); }
              }, 250);
            }
          };
          recognition.start();
        } catch (error) { console.warn('[Martisan voice] browser recognition fallback could not start', error); }
      }
      setState('processing');
      setMessage(ui.speakingQuestion);
      try { await speakQuestion(); }
      catch { if (mounted.current) setMessage(ui.questionNotHeard); }
      if (cancelled) return;

      const mimeType = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find(type => MediaRecorder.isTypeSupported?.(type));
      recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorder.ondataavailable = event => { if (event.data?.size) chunks.push(event.data); };
      recorder.onstop = async () => {
        stream?.getTracks().forEach(track => track.stop());
        audioContext?.close().catch(() => {});
        if (cancelled || !mounted.current) return;
        const audio = new Blob(chunks, { type: recorder.mimeType || 'audio/webm' });
        if (!audio.size) {
          setState('error'); setMessage(ui.noSpeech);
          if (voiceSessionRef.current === session) voiceSessionRef.current = null;
          onActiveChange(false); return;
        }
        try {
          console.info('[Martisan voice] transcription request started', { field, language });
          let transcript = browserTranscript.trim();
          if (!transcript) {
            try {
              const result = await onTranscribe(audio, language);
              transcript = String(result?.transcript || result?.text || '').trim();
            } catch (error) {
              if (!browserTranscript && recognition) await new Promise(resolve => window.setTimeout(resolve, 4000));
              transcript = browserTranscript.trim();
              if (!transcript) throw error;
              console.warn('[Martisan voice] using browser speech recognition fallback', { field, language });
            }
          }
          if (!transcript) throw new Error(ui.noSpeech);
          console.info('[Martisan voice] transcription received', { field, characters: transcript.length });
          onChange(transcript);
          setState('success'); setMessage(ui.success);
        } catch (error) {
          console.error('[Martisan voice] field transcription failed', error);
          setState('error');
          setMessage(error?.message || ui.noSpeech);
        } finally {
          if (voiceSessionRef.current === session) voiceSessionRef.current = null;
          onActiveChange(false);
        }
      };
      recorder.onerror = () => {
        cancelled = true;
        if (frame) cancelAnimationFrame(frame);
        if (voiceSessionRef.current === session) voiceSessionRef.current = null;
        stream?.getTracks().forEach(track => track.stop());
        audioContext?.close().catch(() => {});
        setState('error'); setMessage(ui.recorderError);
        onActiveChange(false);
      };
      recorder.start(250);
      recognitionResultOffset = recognitionResultCount;
      acceptRecognition = true;
      if (recognition && !recognitionActive) try { recognition.start(); } catch (error) { console.warn('[Martisan voice] browser recognition could not restart after prompt', { field, language, error }); }
      setState('listening'); setMessage(ui.listening);
      console.info('[Martisan voice] microphone started', { field, language });

      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      let detectorStarted = false;
      if (AudioContextClass) try {
        audioContext = new AudioContextClass();
        audioContext.resume().catch(() => {});
        const analyser = audioContext.createAnalyser(); analyser.fftSize = 512;
        audioContext.createMediaStreamSource(stream).connect(analyser);
        const samples = new Uint8Array(analyser.fftSize), startedAt = Date.now();
        let heardVoice = false, lastSound = startedAt;
        const detect = () => {
          if (cancelled || recorder?.state !== 'recording') return;
          analyser.getByteTimeDomainData(samples);
          const level = Math.sqrt(samples.reduce((sum, sample) => sum + (sample - 128) ** 2, 0) / samples.length);
          const now = Date.now();
          if (level > 3.8) { heardVoice = true; lastSound = now; }
          if ((heardVoice && now - lastSound > 2200) || (!heardVoice && now - startedAt > 15000) || now - startedAt > 60000) { finish(); return; }
          frame = requestAnimationFrame(detect);
        };
        detectorStarted = true; frame = requestAnimationFrame(detect);
      } catch (error) { console.warn('[Martisan voice] silence detection unavailable; user can stop recording manually', error); }
      if (!detectorStarted) window.setTimeout(() => { if (!cancelled && recorder?.state === 'recording') finish(); }, 60000);
    } catch (error) {
      console.error('[Martisan voice] microphone start failed', error);
      stream?.getTracks().forEach(track => track.stop());
      try { recognition?.abort?.(); } catch {}
      audioContext?.close().catch(() => {});
      if (cancelled || !mounted.current) return;
      setState('error');
      setMessage(error?.name === 'NotAllowedError' || error?.name === 'PermissionDeniedError'
        ? ui.micDenied
        : ui.voiceUnavailable);
      if (voiceSessionRef.current === session) voiceSessionRef.current = null;
      onActiveChange(false);
    }
  };

  return <div className="voice-field">
    <div className="field-mode-row"><span>{ui.chooseMode}</span><div role="group" aria-label={`${label} ${ui.modeGroup}`} className="mode-toggle">
      <button type="button" className={mode==='manual'?'selected':''} aria-pressed={mode==='manual'} onClick={()=>{voiceSessionRef.current?.cancel?.();setMode('manual');setState('idle');setMessage(ui.tapVoice);}}>{ui.manual}</button>
      <button type="button" className={mode==='voice'?'selected':''} aria-pressed={mode==='voice'} onClick={start} disabled={state==='processing'}>{ui.voice}</button>
    </div></div>
    {mode==='voice'&&<div className={`field-voice-panel state-${state}`} role="status" aria-live="polite"><p>{state==='listening'?'🎤 ':state==='processing'?'◌ ':state==='success'?'✓ ':'🎤 '}{message}</p>{question&&<small>{question}</small>}{state==='listening'&&<button type="button" className="button-secondary" onClick={()=>{const session=voiceSessionRef.current;if(session?.finish)session.finish();else session?.cancel?.();}}>{ui.doneSpeaking}</button>}</div>}
    {renderInput?renderInput({value:value||'',onChange}):<input value={value||''} onChange={event=>onChange(event.target.value)} aria-label={label} placeholder={label==='Product story'?'Tell buyers how you made this product…':`Enter ${label.toLowerCase()}`} />}
  </div>;
}

export function ProductPhoto({ photo, setPhoto, sourcePhoto, setSourcePhoto, onStatus, onImageReady, onRemoveBackground, ui, appUi={} }) {
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState('');
  const [reviewOpen,setReviewOpen]=useState(false);
  const [enhancedCandidate,setEnhancedCandidate]=useState('');
  const [cameraOpen,setCameraOpen]=useState(false);
  const [cameraStarting,setCameraStarting]=useState(false);
  const inputRef=useRef(null);
  const cameraVideoRef=useRef(null);
  const cameraStreamRef=useRef(null);
  const sourceFileRef=useRef(null);
  const validatePreview=source=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>image.naturalWidth>0&&image.naturalHeight>0?resolve(source):reject(new Error('Invalid image dimensions'));image.onerror=()=>reject(new Error('Image preview could not be decoded'));image.src=source});
  const generate=async(file=sourceFileRef.current)=>{
    if(!file&&!sourcePhoto)return;
    setBusy(true);setError('');setEnhancedCandidate('');
    try{
      let inputFile=file;
      if(!inputFile){const response=await fetch(sourcePhoto);const blob=await response.blob();inputFile=new File([blob],'artisan-product.webp',{type:blob.type||'image/webp'});}
      let result,lastError;
      for(let attempt=0;attempt<2;attempt++){
        try{result=await onRemoveBackground(inputFile);if(!result?.photo)throw new Error('No image was returned');await validatePreview(result.photo);break}
        catch(error){lastError=error;if(attempt===0)console.info('[Martisan image] retrying enhancement once',{reason:error?.name||'request failed'})}
      }
      if(!result?.photo)throw lastError||new Error('No enhanced image was returned');
      setEnhancedCandidate(result.photo);onStatus(result.message||ui.backgroundDone);
      return result;
    }
    catch(error){
      console.error('[Martisan image] background enhancement failed',error);
      setError(appUi.photoEnhanceFailed||ui.backgroundFailed);
    }
    finally{setBusy(false)}
  };
  const choose=async event=>{
    const file=event.target.files?.[0]; if(!file)return;
    if(!['image/png','image/jpeg','image/webp'].includes(file.type)){setError(ui.photoInvalid);event.target.value='';return}
    if(file.size>15*1024*1024){setError(ui.photoTooLarge);event.target.value='';return}
    console.info('[Martisan image] image selected', { type: file.type, bytes: file.size });
    setBusy(true);setError('');setEnhancedCandidate('');
    try{const source=await compactImage(file);const compactBlob=await (await fetch(source)).blob();const optimizedFile=new File([compactBlob],'artisan-product.webp',{type:'image/webp'});sourceFileRef.current=optimizedFile;setSourcePhoto(source);setPhoto(source);onImageReady?.(optimizedFile);console.info('[Martisan image] photo prepared for product catalog', {type:optimizedFile.type,bytes:optimizedFile.size});onStatus(ui.cleaning);await generate(optimizedFile)}
    catch(error){console.error('[Martisan image] image processing failed', error);setError(error?.message||ui.photoPrepareError)}
    finally{setBusy(false);event.target.value='';}
  };
  const stopCamera=()=>{
    cameraStreamRef.current?.getTracks().forEach(track=>track.stop());
    cameraStreamRef.current=null;
    if(cameraVideoRef.current)cameraVideoRef.current.srcObject=null;
    setCameraOpen(false);
  };
  const openCamera=async()=>{
    setError('');
    if(!navigator.mediaDevices?.getUserMedia){setError(ui.cameraUnsupported);return}
    setCameraStarting(true);
    try{
      const stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'}},audio:false});
      cameraStreamRef.current=stream;
      setCameraOpen(true);
    }catch(error){
      setError(error?.name==='NotAllowedError'||error?.name==='PermissionDeniedError'?ui.cameraDenied:error?.message||ui.cameraUnsupported);
    }finally{setCameraStarting(false)}
  };
  useEffect(()=>{
    if(cameraOpen&&cameraVideoRef.current&&cameraStreamRef.current){cameraVideoRef.current.srcObject=cameraStreamRef.current;cameraVideoRef.current.play().catch(()=>{});}
  },[cameraOpen]);
  useEffect(()=>()=>cameraStreamRef.current?.getTracks().forEach(track=>track.stop()),[]);
  const captureCameraPhoto=async()=>{
    const video=cameraVideoRef.current;
    if(!video?.videoWidth){setError('The camera is still starting. Please wait a moment and try again.');return}
    const canvas=document.createElement('canvas');canvas.width=video.videoWidth;canvas.height=video.videoHeight;
    const context=canvas.getContext('2d');if(!context){setError('This browser cannot process the camera photo.');return}
    context.drawImage(video,0,0,canvas.width,canvas.height);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',.92));
    if(!blob){setError('Could not capture the photo. Please try again.');return}
    stopCamera();
    const file=new File([blob],'artisan-camera-photo.jpg',{type:'image/jpeg'});
    await processImage(file);
  };
  const processImage=async file=>{
    setBusy(true);setError('');
    try{const source=await compactImage(file);const compactBlob=await (await fetch(source)).blob();const optimizedFile=new File([compactBlob],'artisan-product.webp',{type:'image/webp'});sourceFileRef.current=optimizedFile;setSourcePhoto(source);setPhoto(source);onImageReady?.(optimizedFile);onStatus(ui.cleaning);await generate(optimizedFile)}
    catch{setError(ui.photoPrepareError);}
    finally{setBusy(false)}
  };
  const useOriginal=()=>{setPhoto(sourcePhoto);setEnhancedCandidate('');setError('');onStatus(appUi.originalReady||ui.preview)};
  const acceptEnhanced=()=>{if(!enhancedCandidate)return;setPhoto(enhancedCandidate);setEnhancedCandidate('');setError('');onStatus(ui.backgroundDone)};
  const removePhoto=()=>{sourceFileRef.current=null;setSourcePhoto('');setPhoto('');setEnhancedCandidate('');onImageReady?.(null);setError('');onStatus('Product photo removed.')};
  return <section className="photo-workbench" aria-label="Product photo preparation">
    <input ref={inputRef} className="photo-file-input" type="file" accept="image/jpeg,.jpg,.jpeg,image/png,image/webp" onChange={choose}/>
    {sourcePhoto?<>
      <figure className="product-photo-preview"><figcaption>{ui.preview}</figcaption><button type="button" className="photo-preview photo-preview-button" onClick={()=>setReviewOpen(true)} aria-label={ui.preview}><img src={photo||sourcePhoto} alt={ui.preview}/>{busy&&<i className="photo-busy">{ui.cleaning}</i>}</button></figure>
      {enhancedCandidate&&<section className="enhanced-photo-review" aria-live="polite"><b>{appUi.enhancedPreview||ui.preview}</b><img src={enhancedCandidate} alt={appUi.enhancedPreview||ui.preview}/><div className="photo-actions"><button type="button" className="button-secondary" onClick={()=>generate()} disabled={busy}>{appUi.retry||ui.cleanAgain}</button><button type="button" className="button-secondary" onClick={useOriginal} disabled={busy}>{appUi.useOriginal||ui.preview}</button><button type="button" className="button-primary" onClick={acceptEnhanced} disabled={busy}>{appUi.acceptPhoto||ui.done}</button></div></section>}
      <div className="photo-actions"><button type="button" className="button-secondary" onClick={()=>inputRef.current?.click()} disabled={busy}>{busy?ui.cleaning:ui.changePhoto}</button><button type="button" className="button-secondary" onClick={openCamera} disabled={busy||cameraStarting}>{cameraStarting?ui.cameraStarting:ui.camera}</button><button type="button" className="button-secondary" onClick={removePhoto} disabled={busy}>{ui.removePhoto}</button></div>
      <button type="button" className="button-light clean-photo-button" onClick={()=>generate()} disabled={busy}>{busy?ui.cleaning:ui.cleanAgain}</button>
      <small className="photo-help">{ui.photoHelp}</small>
    </>:<div className="photo-empty"><b>{busy?'…':'＋'}</b><strong>{busy?ui.cleaning:ui.photoTitle}</strong><small>{ui.photoHint}</small><div className="photo-actions"><button type="button" className="button-primary" onClick={()=>inputRef.current?.click()} disabled={busy}>{ui.upload}</button><button type="button" className="button-primary" onClick={openCamera} disabled={busy||cameraStarting}>{cameraStarting?ui.cameraStarting:ui.camera}</button></div></div>}
    {cameraOpen&&<div className="photo-review-backdrop" role="presentation" onClick={stopCamera}><section className="photo-review-dialog camera-dialog" role="dialog" aria-modal="true" aria-labelledby="camera-title" onClick={event=>event.stopPropagation()}><button type="button" className="photo-review-close" onClick={stopCamera} aria-label={ui.close}>×</button><h2 id="camera-title">{ui.cameraTitle}</h2><video ref={cameraVideoRef} className="camera-preview" autoPlay playsInline muted/><div className="photo-actions"><button type="button" className="button-secondary" onClick={stopCamera}>{ui.cancel}</button><button type="button" className="button-primary" onClick={captureCameraPhoto}>{ui.takePhoto}</button></div></section></div>}
    {reviewOpen&&<div className="photo-review-backdrop" role="presentation" onClick={()=>setReviewOpen(false)}><section className="photo-review-dialog" role="dialog" aria-modal="true" aria-labelledby="photo-review-title" onClick={event=>event.stopPropagation()}><button type="button" className="photo-review-close" onClick={()=>setReviewOpen(false)} aria-label={ui.close}>×</button><h2 id="photo-review-title">{ui.photoReview}</h2><img className="listing-photo-large" src={photo||sourcePhoto} alt={ui.preview}/><button type="button" className="button-primary" onClick={()=>setReviewOpen(false)}>{ui.done}</button></section></div>}
    {error&&<div className="photo-error" role="alert"><span>{error}</span><div className="photo-actions"><button type="button" className="button-secondary" onClick={()=>generate()} disabled={busy}>{appUi.retry||ui.cleanAgain}</button><button type="button" className="button-primary" onClick={useOriginal} disabled={busy}>{appUi.useOriginal||ui.preview}</button></div></div>}
  </section>;
}
