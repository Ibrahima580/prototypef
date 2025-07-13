import Link from 'next/link';
import styles from './../styles/Navbar.module.css';
import Image from 'next/image';

const Navbar = () => {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/">
          <Image src="/logo.png" alt="Logo" width={100} height={100} />
        </Link>
      </div>
      <div className={styles.links}>
        <Link href="/inscription" className={styles.link}>Créer un compte</Link>
        <a href="#presentation" className={styles.link}>À propos</a>
      </div>
    </nav>
  );
};

export default Navbar;
