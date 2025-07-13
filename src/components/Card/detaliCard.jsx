import React from "react";
import PropTypes from 'prop-types';
import './Card.css';

export default function DetailCard({ BlindBox }) 
{
    return (
    <div>
        <div className="detail-card">
            <img src={BlindBox.image} />
            <h2>{BlindBox.title}</h2>
            <p>{BlindBox.description}</p>
            <p>{BlindBox.price}</p>
        </div>
        <div className="detail-card-comments">
           <h3>评论</h3>
           <ul>
               {BlindBox.comments.map((comment, index) => (
                   <li key={index}>
                       <strong>{comment.user}</strong>: {comment.text}
                   </li>
               ))}
           </ul>
        </div>
    </div>
    );
}
DetailCard.propTypes = {
    BlindBox: PropTypes.shape({
        image: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        description: PropTypes.string.isRequired,
        price: PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.number
        ]).isRequired,
        comments: PropTypes.arrayOf(
            PropTypes.shape({
                user: PropTypes.string.isRequired,
                text: PropTypes.string.isRequired
            })
        ).isRequired
    }).isRequired
};