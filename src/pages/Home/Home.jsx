import React from 'react';
import ThumbnailCard from '../../components/Card/thumbnailCard.jsx';
import './Home.css';
export default function Home() {
    const blindBoxes = [
        {
            id: 1,
            image: 'https://example.com/image1.jpg',
            title: 'Mystery Box 1',
            description: 'This is a mystery box with various items.',
            price: '$20',
            comments: [
                {
                    user: 'Alice',
                    text: 'I love this box!'
                }
            ]
        },
        {
            id: 2,
            image: 'https://example.com/image2.jpg',
            title: 'Mystery Box 2',
            description: 'This box contains surprise gifts.',
            price: '$30',
            comments: [
                {
                    user: 'Bob',
                    text: 'Can\'t wait to open this!'
                }
            ]
        }
    ];
    const [searchTerm, setSearchTerm] = React.useState('');
    const filteredBoxes = blindBoxes.filter(box =>
        box.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        box.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="home">
            <h1> Blind Box Store</h1>
            <input
                type="text"
                placeholder="Search for blind boxes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
            />
            <div className="blind-boxes">
                {filteredBoxes.map(box => (
                    <ThumbnailCard key={box.id} blindBox={box} />
                ))}
            </div>
        </div>
    );
   
}
