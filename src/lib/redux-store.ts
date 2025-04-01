// This file creates a proper Redux store for react-beautiful-dnd
import { createStore as reduxCreateStore, applyMiddleware } from "redux";

// Define a simple reducer
const initialState = {};
const reducer = (state = initialState, action: any) => {
  switch (action.type) {
    default:
      return state;
  }
};

// Create the store with the Symbol.observable polyfill
const createStore = () => {
  // Create a basic Redux store
  const store = reduxCreateStore(reducer);

  // Add the Symbol.observable method if it doesn't exist
  if (!store[Symbol.observable]) {
    store[Symbol.observable] = function () {
      return {
        subscribe: (observer: any) => {
          if (typeof observer !== "object") {
            observer = { next: observer };
          }

          observer.next && observer.next(store.getState());

          const unsubscribe = store.subscribe(() => {
            observer.next && observer.next(store.getState());
          });

          return { unsubscribe };
        },
        [Symbol.observable]: function () {
          return this;
        },
      };
    };
  }

  return store;
};

export const store = createStore();
