import { useState } from "react"
import "./slider.scss"

function Slider({images}) {
    const imageList = Array.isArray(images) && images.length ? images : ["/noavatar.jpg"];
    const [imageIndex,setImageIndex] = useState(null);

    const changeSlide = (direction) => {
        if(direction === "left") {
            if(imageIndex === 0) {
                setImageIndex(imageList.length-1);
            }else {
                setImageIndex(imageIndex-1);
            }
        }else {
            if(imageIndex === imageList.length-1) {
                setImageIndex(0);
            }
            else{
                setImageIndex(imageIndex+1);
            }
        }
    }
    
    return( 
        <div className="slider">
            {imageIndex != null && ( <div className="fullSlider">
                <div className="arrow" onClick={()=>changeSlide("left")}>
                    <img src="./arrow.png" alt="" />
                </div>
                <div className="imgContainer">
                    <img src={imageList[imageIndex]} alt="" />
                </div>
                <div className="arrow" onClick={()=>changeSlide("right")}>
                    <img src="./arrow.png" className="right" alt="" />
                </div>
                <div className="close" onClick={()=>setImageIndex(null)}>x</div>
            </div> )}
            <div className="bigImage">
                <img src={imageList[0]} alt="" onClick={()=>setImageIndex(0)}/>
            </div>
            <div className="smallImages">
                {imageList.slice(1).map((image,index)=>(
                    <img src={image} alt="" key={index} onClick={()=>setImageIndex(index+1)}/>
                ))}
            </div>
        </div>
    )
}

export default Slider