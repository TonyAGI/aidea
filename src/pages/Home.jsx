import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import LocomotiveScroll from 'locomotive-scroll';
import 'locomotive-scroll/dist/locomotive-scroll.css';
import '../styles/home.css';

const frameModules = import.meta.glob('../assets/frames/*.{png,jpg,jpeg,webp}', {
  eager: true,
  import: 'default',
  query: '?url',
});
const frameSources = Object.values(frameModules);

const Home = () => {
  const mainRef = useRef(null);
  const canvasRef = useRef(null);
  const hasFrames = frameSources.length > 0;

  useEffect(() => {
    if (!hasFrames) {
      return undefined;
    }

    const mainEl = mainRef.current;
    const canvas = canvasRef.current;
    if (!mainEl || !canvas) return undefined;

    gsap.registerPlugin(ScrollTrigger);

    const locoScroll = new LocomotiveScroll({
      el: mainEl,
      smooth: true,
    });

    ScrollTrigger.scrollerProxy(mainEl, {
      scrollTop(value) {
        return arguments.length ? locoScroll.scrollTo(value, 0, 0) : locoScroll.scroll.instance.scroll.y;
      },
      getBoundingClientRect() {
        return {
          top: 0,
          left: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        };
      },
      pinType: mainEl.style.transform ? 'transform' : 'fixed',
    });

    const refreshHandler = () => locoScroll.update();
    ScrollTrigger.addEventListener('refresh', refreshHandler);
    ScrollTrigger.refresh();

    const context = canvas.getContext('2d');
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      renderFrame();
    };

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const images = frameSources.map((src) => {
      const image = new Image();
      image.src = src;
      return image;
    });

    const imageSeq = { frame: 0 };

    const renderFrame = () => {
      if (!images.length) return;
      const img = images[imageSeq.frame];
      if (!img || !img.complete) return;

      const hRatio = canvas.width / img.width;
      const vRatio = canvas.height / img.height;
      const ratio = Math.max(hRatio, vRatio);
      const centerShiftX = (canvas.width - img.width * ratio) / 2;
      const centerShiftY = (canvas.height - img.height * ratio) / 2;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        img,
        0,
        0,
        img.width,
        img.height,
        centerShiftX,
        centerShiftY,
        img.width * ratio,
        img.height * ratio,
      );
    };

    let frameTween;
    if (images.length) {
      frameTween = gsap.to(imageSeq, {
        frame: images.length - 1,
        snap: 'frame',
        ease: 'none',
        scrollTrigger: {
          scrub: 0.15,
          trigger: '#page>canvas',
          start: 'top top',
          end: '600% top',
          scroller: mainEl,
        },
        onUpdate: renderFrame,
      });
      images[0].onload = renderFrame;
    }

    const pinnedSections = ['#page1', '#page2', '#page3'];
    const pinTriggers = pinnedSections.map((selector) =>
      gsap.to(selector, {
        scrollTrigger: {
          trigger: selector,
          start: 'top top',
          end: 'bottom top',
          pin: true,
          scroller: mainEl,
        },
      }),
    );

    ScrollTrigger.create({
      trigger: '#page>canvas',
      pin: true,
      scroller: mainEl,
      start: 'top top',
      end: '600% top',
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      ScrollTrigger.removeEventListener('refresh', refreshHandler);
      pinTriggers.forEach((trigger) => trigger.kill());
      frameTween?.kill();
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
      locoScroll.destroy();
    };
  }, [hasFrames]);

  return (
    <div id="main" ref={mainRef}>
      <div id="page">
        <div id="loop">
          <h1>
            <b>AGENTIC</b> AGENTS IS THE <b>
              <i>REAL</i>
            </b>{' '}
            <span>STORY</span> IN THE <span>
              <i>Agentic Intelligence</i>
            </span>
          </h1>
          <h1>
            <b>AGENTIC</b> AGENTS IS THE <b>
              <i>REAL</i>
            </b>{' '}
            <span>STORY</span> IN THE <span>
              <i>Agentic Intelligence</i>
            </span>
          </h1>
          <h1>
            <b>AGENTIC</b> AGENTS IS THE <b>
              <i>REAL</i>
            </b>{' '}
            <span>STORY</span> IN THE <span>
              <i>Agentic Intelligence</i>
            </span>
          </h1>
        </div>
        <h3>
          AI&lt;&gt;DEA plans to create a world where everyone is the developer no matter the circumstances{' '}
          <br /> For the devs by the devs
        </h3>
        <h4>...SCROLL TO READ</h4>
        {hasFrames ? (
          <canvas ref={canvasRef} />
        ) : (
          <div className="hero-fallback">
            <p>
              Add frame images to <code>src/assets/frames</code> to enable the scroll-driven canvas animation. Until then,
              this static hero matches the original layout.
            </p>
          </div>
        )}
      </div>
      <div id="page1">
        <div id="right-text">
          <h3>DEMOCRATIZING / KEY WORD</h3>
          <h1>
            HAVE FUN
            <br />
            LET&apos;S DEVELOP
            <br />
            FOR A GREATER INTERNET
          </h1>
        </div>
        <div id="left-text">
          <h1>
            MAKE AN IDEA
            <br />
            TAKE A CHANCE
            <br />
            BUILD THE STORY
          </h1>
          <h3>*AND MAINTAIN GOOD HUMANITY</h3>
        </div>
      </div>
      <div id="page2">
        <div id="text1">
          <h3>CYBERFICTION / HAVE FUN</h3>
          <h1>
            LET&apos;S
            <br />
            HAVE FUN
            <br />
            TOGETHER
          </h1>
        </div>
        <div id="text2">
          <p>
            LET&apos;S HAVE A BLAST! LET&apos;S JUST THROW AWAY AGE, GENDER, REGION,
            <br /> STATUS, ETC., DON&apos;T COMPETE, DON&apos;T FIGHT, COOPERATE AND SHARE
            <br /> WITH EACH OTHER AND ENJOY IT TOGETHER! SO THAT YOU CAN STAND
            <br /> THERE IN THE NOT-TOO-DISTANT FUTURE AND DREAM OF ANOTHER NEW
            <br /> FUTURE
          </p>
        </div>
      </div>
      <div id="page3">
        <div id="text3">
          <h3>AGENTIC / INTELLIGENCE</h3>
          <h1>
            AGENTS
            <br />
            IS OUR
            <br />
            PLAYGROUND
          </h1>
        </div>
      </div>
    </div>
  );
};

export default Home;

