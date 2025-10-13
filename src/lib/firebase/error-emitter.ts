import { EventEmitter } from 'events';

// This is a global event emitter that can be used to broadcast events
// throughout the application.
//
// It is used in this application to broadcast Firestore permission errors
// to the FirebaseErrorListener component.
export const errorEmitter = new EventEmitter();
