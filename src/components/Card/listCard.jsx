import React from "react";
import PropTypes from 'prop-types';
import './Card.css';

export default function ListCard({ Item }) {

    return (
        <div className="list-card">
            <img src={Item.image}/>
            <h3>{Item.title}</h3>
            <p>{Item.description}</p>
            <p>{Item.price}</p>
            <p>{Item.time}</p>
        </div>
    );
}
ListCard.propTypes = {
    Item: PropTypes.shape({
        image: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        price: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]).isRequired,
        time: PropTypes.string.isRequired
    }).isRequired
};