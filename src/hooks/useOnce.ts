import { useRef } from "react";

/**
* 
* Ensure that something runs only once. The intended usage is:
*  
* ```ts
* const once = useOnce()
* useEffect(() => {
*   once(() => {
*     // Do something only once, including Strict Mode
*   })
* }, []);
* ```
* 
*/
export function useOnce() {
  const initial = useRef(true);

  return (fn: () => void) => {
    if (initial.current) {
      fn();
      initial.current = false;
    }
  };
}