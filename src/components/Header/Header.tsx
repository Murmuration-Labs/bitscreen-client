import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './Headers.css';
import { faSearch } from '@fortawesome/free-solid-svg-icons';

function Header(): JSX.Element {
  return (
    <header>
      <FontAwesomeIcon icon={faSearch} /> Bit<strong>Screen</strong>
    </header>
  );
}

export default Header;
