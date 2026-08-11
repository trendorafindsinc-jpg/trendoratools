import './styles/app.css';
import { AppStore } from './state/store';
import { DataRepository } from './data/repositories';
import { createStorage } from './data/storage';
import { createApp } from './ui/app';

const storage = createStorage();
const repository = new DataRepository(storage);
const store = new AppStore(repository);

const root = document.querySelector<HTMLElement>('#app');
if (!root) {
  throw new Error('Root element #app not found');
}

createApp(root, store);
