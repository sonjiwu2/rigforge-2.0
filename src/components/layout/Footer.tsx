import { TextLink } from '../ui/Button';
import { VisuallyHidden } from '../ui/VisuallyHidden';
import styles from './Footer.module.css';

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <p>
          Данные о ценах и характеристиках:{' '}
          <TextLink href="https://vantaspec.com" target="_blank" rel="noopener noreferrer">
            VantaSpec<VisuallyHidden> (откроется в новой вкладке)</VisuallyHidden>
          </TextLink>
        </p>
        <p>Описание серий — Wikipedia, CC BY-SA 4.0</p>
        <p>Фото товаров: VantaSpec и Wikimedia Commons</p>
        <p>Курсы валют: Currency-api</p>
        <p>Сборки и отзывы хранятся только в этом браузере</p>
      </div>
    </footer>
  );
}
