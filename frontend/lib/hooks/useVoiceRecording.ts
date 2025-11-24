import { useState, useEffect, useRef, useCallback } from 'react';

interface VoiceRecordingOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface VoiceRecordingState {
  isRecording: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
  confidence: number;
}

interface VoiceRecordingControls {
  startRecording: () => void;
  stopRecording: () => void;
  resetTranscript: () => void;
  cancelRecording: () => void;
}

type UseVoiceRecordingReturn = VoiceRecordingState & VoiceRecordingControls;

/**
 * Custom hook for voice recording and transcription using Web Speech API
 * 
 * @param options - Configuration options for speech recognition
 * @returns Voice recording state and control functions
 */
export function useVoiceRecording(
  options: VoiceRecordingOptions = {}
): UseVoiceRecordingReturn {
  const {
    language = 'en-US',
    continuous = true,
    interimResults = true,
    maxAlternatives = 1,
  } = options;

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
    } else {
      setIsSupported(false);
      setError('Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
    }
  }, []);

  // Configure recognition instance
  useEffect(() => {
    if (!recognitionRef.current) return;

    const recognition = recognitionRef.current;
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = maxAlternatives;

    // Event: Results received
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimText = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcriptPiece = result[0].transcript;

        if (result.isFinal) {
          finalTranscript += transcriptPiece + ' ';
          if (result[0].confidence) {
            setConfidence(result[0].confidence);
          }
        } else {
          interimText += transcriptPiece;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => prev + finalTranscript);
      }
      setInterimTranscript(interimText);
    };

    // Event: Speech ended
    recognition.onspeechend = () => {
      if (!continuous) {
        recognition.stop();
        setIsRecording(false);
      }
    };

    // Event: Error occurred
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      
      let errorMessage = 'An error occurred during speech recognition.';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not found or not accessible.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone permission denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error occurred. Check your connection.';
          break;
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }
      
      setError(errorMessage);
      setIsRecording(false);
    };

    // Event: Recognition ended
    recognition.onend = () => {
      if (isRecording && continuous) {
        // Restart if still recording and in continuous mode
        try {
          recognition.start();
        } catch (err) {
          console.error('Error restarting recognition:', err);
          setIsRecording(false);
        }
      } else {
        setIsRecording(false);
      }
    };

    return () => {
      if (recognition) {
        recognition.onresult = null;
        recognition.onspeechend = null;
        recognition.onerror = null;
        recognition.onend = null;
      }
    };
  }, [language, continuous, interimResults, maxAlternatives, isRecording]);

  // Start recording
  const startRecording = useCallback(() => {
    if (!recognitionRef.current || !isSupported) {
      setError('Speech recognition is not available.');
      return;
    }

    try {
      setError(null);
      setInterimTranscript('');
      recognitionRef.current.start();
      setIsRecording(true);
    } catch (err: any) {
      if (err.message.includes('already started')) {
        // Already recording, ignore
        return;
      }
      console.error('Error starting recognition:', err);
      setError('Failed to start recording. Please try again.');
    }
  }, [isSupported]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
      setIsRecording(false);
      setInterimTranscript('');
    } catch (err) {
      console.error('Error stopping recognition:', err);
    }
  }, []);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
    setError(null);
  }, []);

  // Cancel recording (stop and reset)
  const cancelRecording = useCallback(() => {
    stopRecording();
    resetTranscript();
  }, [stopRecording, resetTranscript]);

  return {
    isRecording,
    transcript,
    interimTranscript,
    error,
    isSupported,
    confidence,
    startRecording,
    stopRecording,
    resetTranscript,
    cancelRecording,
  };
}
