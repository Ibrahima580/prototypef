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
        <Link href="/" className={styles.link}>Accueil</Link>
        <Link href="/connexion" className={styles.link}>Se connecter</Link>
      </div>
    </nav>
  );
};

export default Navbar;
