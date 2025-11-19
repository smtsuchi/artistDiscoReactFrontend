import React, { RefObject } from 'react';

interface FooterProps {
  swipe: (direction: string) => void;
  exButton: RefObject<HTMLDivElement | null>;
}

const Footer: React.FC<FooterProps> = ({ swipe, exButton }) => {
  const swipeLeft = () => {
    if (exButton.current && !exButton.current.getAttribute('disabled')) {
      swipe('left');
    }
    if (exButton.current) {
      exButton.current.setAttribute('disabled', 'disabled');
    }
  };

  const swipeRight = () => {
    if (exButton.current && !exButton.current.getAttribute('disabled')) {
      swipe('right');
    }
    if (exButton.current) {
      exButton.current.setAttribute('disabled', 'disabled');
    }
  };

  return (
    <div className="footer">
      <div className="ex foot" onClick={swipeLeft} ref={exButton}>
        <i id="ex" className="fas fa-times"></i>
      </div>
      <div className="heart foot" onClick={swipeRight}>
        <i id="heart" className="fas fa-heart"></i>
      </div>
    </div>
  );
};

export default Footer;
