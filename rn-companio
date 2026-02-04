import React, { useRef } from 'react';
import { SafeAreaView, Alert, Linking, Platform, PermissionsAndroid } from 'react-native';
import { WebView } from 'react-native-webview';
import Tts from 'react-native-tts';

/*
  RN Companion WebView wrapper for S*A AI Assistant
  - LOCAL_BUNDLE = true -> loads bundled web UI from file:///android_asset/www/index.html inside APK
  - Handles native actions: speak_text, place_call, send_message, list_native_voices
  - Make sure react-native-tts and react-native-webview are installed in rn-companion
*/

const LOCAL_BUNDLE = true;
const REMOTE_URL = 'http://10.0.2.2:3000';
const HANDSHAKE_TOKEN = 'omni-handshake-dev-token-REPLACE_ME';

Tts.setDefaultLanguage('en-US');
Tts.setDefaultRate(1.0);

const requestCallPermission = async () => {
  if (Platform.OS !== 'android') return true;
  const has = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
  if (has) return true;
  const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.CALL_PHONE);
  return res === PermissionsAndroid.RESULTS.GRANTED;
};

const requestSmsPermission = async () => {
  if (Platform.OS !== 'android') return true;
  const has = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.SEND_SMS);
  if (has) return true;
  const res = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.SEND_SMS);
  return res === PermissionsAndroid.RESULTS.GRANTED;
};

const App = () => {
  const webviewRef = useRef(null);

  const postToWeb = (obj) => {
    try {
      webviewRef.current && webviewRef.current.postMessage(JSON.stringify(obj));
    } catch (e) {
      console.warn('postToWeb failed', e);
    }
  };

  const speakWithNotify = async (text, lang, voiceName, requestId) => {
    try {
      if (lang) {
        try { Tts.setDefaultLanguage(lang); } catch (e) {}
      }
      if (voiceName && Tts.setDefaultVoice) {
        try { Tts.setDefaultVoice(voiceName); } catch (e) {}
      }

      const onStart = () => { if (requestId) postToWeb({ type: 'tts_event', requestId, event: 'start' }); };
      const onFinish = () => { if (requestId) postToWeb({ type: 'tts_event', requestId, event: 'finish' }); };

      try { Tts.addEventListener('tts-start', onStart); Tts.addEventListener('tts-finish', onFinish); } catch(e){}
      Tts.stop();
      Tts.speak(text);

      // defensive finish event after timeout
      setTimeout(() => {
        try { if (requestId) postToWeb({ type: 'tts_event', requestId, event: 'finish' }); } catch(e){}
        try { Tts.removeEventListener && Tts.removeEventListener('tts-start', onStart); } catch(e){}
        try { Tts.removeEventListener && Tts.removeEventListener('tts-finish', onFinish); } catch(e){}
      }, 7000);

    } catch (err) {
      try { if (requestId) postToWeb({ type: 'tts_event', requestId, event: 'error', message: String(err) }); } catch(e){}
    }
  };

  const performAction = async (msg) => {
    if (!msg || msg.token !== HANDSHAKE_TOKEN) {
      console.warn('Invalid token in message, ignoring', msg?.token);
      return;
    }
    try {
      if (msg.type === 'list_native_voices') {
        try {
          const voices = await Tts.voices();
          postToWeb({ type: 'native_voices', requestId: msg.requestId, voices });
        } catch (e) {
          postToWeb({ type: 'native_voices', requestId: msg.requestId, voices: [] });
        }
        return;
      }

      if (msg.type === 'speak_text') {
        const text = msg.args?.text || '';
        const lang = msg.args?.lang || 'en-US';
        const requestId = msg.requestId || null;
        const voice = msg.args?.voice;
        if (!text) return;
        if (requestId) {
          await speakWithNotify(text, lang, voice, requestId);
        } else {
          try { if (lang) Tts.setDefaultLanguage(lang); } catch (e) {}
          try { if (voice && Tts.setDefaultVoice) Tts.setDefaultVoice(voice); } catch (e) {}
          Tts.stop();
          Tts.speak(text);
        }
        return;
      }

      if (msg.type === 'place_call') {
        const phone = msg.args?.phone || msg.args?.contact_phone || '';
        const allowed = await requestCallPermission();
        if (!allowed) {
          Alert.alert('Permission denied', 'Call permission is required to place calls.');
          return;
        }
        const telUrl = `tel:${encodeURIComponent(phone)}`;
        Linking.openURL(telUrl);
        return;
      }

      if (msg.type === 'send_message') {
        const phone = msg.args?.phone || msg.args?.contact_phone || '';
        const body = msg.args?.message || '';
        const allowed = await requestSmsPermission();
        if (!allowed) {
          Alert.alert('Permission denied', 'SMS permission is required to send messages.');
          return;
        }
        const smsUrl = `sms:${encodeURIComponent(phone)}?body=${encodeURIComponent(body)}`;
        Linking.openURL(smsUrl);
        return;
      }

      if (msg.type === 'open_url') {
        const url = msg.args?.url;
        if (url) Linking.openURL(url);
        return;
      }

      console.log('Unrecognized message from web:', msg);
    } catch (err) {
      console.error('performAction error', err);
    }
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      performAction(data);
    } catch (err) {
      console.warn('Invalid message to native bridge', err, event.nativeEvent.data);
    }
  };

  const webSource = LOCAL_BUNDLE ? { uri: 'file:///android_asset/www/index.html' } : { uri: REMOTE_URL };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <WebView
        ref={webviewRef}
        source={webSource}
        javaScriptEnabled
        originWhitelist={['*']}
        onMessage={handleMessage}
        injectedJavaScript={`window.__OMNI_HANDSHAKE_TOKEN = "${HANDSHAKE_TOKEN}"; true;`}
      />
    </SafeAreaView>
  );
};

export default App;
