import React from 'react';
import PropTypes from 'prop-types';
import './Card.css';
export default function ThumbnailCard({ blindBox }) {
    return (
        <div className="thumbnail-card">
            <img src={blindBox.image} />
            <h3>{blindBox.title}</h3>
            <p>{blindBox.price}</p>
        </div>
    );
}

ThumbnailCard.propTypes = {
    blindBox: PropTypes.shape({
        image: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        price: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]).isRequired
    }).isRequired
};