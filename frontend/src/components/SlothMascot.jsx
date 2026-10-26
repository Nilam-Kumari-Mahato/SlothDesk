import slothImg from '../assets/Sloth_1.png';

export default function SlothMascot() {
    return (
        <div
            className="fixed bottom-0 left-0 pointer-events-none select-none z-10"
            aria-hidden="true"
        >
            <img
                src={slothImg}
                alt="Sloth mascot"
                className="object-contain w-[160px] sm:w-[210px] md:w-[255px]"
                draggable={false}
            />
        </div>
    );
}
