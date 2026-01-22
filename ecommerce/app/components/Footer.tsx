import Image from 'next/image';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white mt-8">
      <div className="pt-10 pb-8">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-8">
            {/* Company Info */}
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <Image 
                  src="/logotsas.png" 
                  alt="Tsaas Logo" 
                  width={40} 
                  height={40} 
                  className="rounded-lg"
                />
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Tsaas.mn
                  </h3>
                  <p className="text-gray-400 text-xs">.mn</p>
                </div>
              </div>
              
              <p className="text-gray-300 text-sm leading-relaxed mb-4 max-w-md">
              "ПОСЫН ЦААС БӨӨНИЙ ХУДАЛДАА, КАССЫН ТОНОГ ТӨХӨӨРӨМЖИЙН ТӨВ"              </p>
              
              {/* Social Links */}
              <div className="flex space-x-3">
                {['f', 't', 'i', 'p'].map((social, index) => (
                  <a
                    key={index}
                    href="#"
                    className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded flex items-center justify-center transition-colors"
                    aria-label="Social"
                  >
                    <span className="text-sm">{social}</span>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-sm font-bold mb-4 text-white">
                Холбоос
              </h4>
              <ul className="space-y-2">
                {['Нүүр', 'Бүтээгдэхүүн', 'Ангилал', 'Бидний тухай', 'Тусламж'].map((link, index) => (
                  <li key={index}>
                    <a 
                      href="#" 
                      className="text-gray-400 hover:text-white text-sm transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h4 className="text-sm font-bold mb-4 text-white">
                Холбоо Барих
              </h4>
              <ul className="space-y-3">
                <li className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Утас</div>
                    <div className="text-white text-sm">+976 7000-5060</div>
                  </div>
                </li>
                
                <li className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Имэйл</div>
                    <div className="text-white text-sm">info@tsaas.mn</div>
                  </div>
                </li>
                
                <li className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-gray-800 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <div className="text-gray-400 text-xs">Хаяг</div>
                    <div className="text-white text-sm">Улаанбаатар хот, Хан-Уул дүүрэг 2-р хороо 19 Үйлчилгээний төвөөс баруун тийш 15-р сургуулийн дэргэд</div>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
     <div className="border-t border-gray-800 pt-2 pb-2">
  <div className="container mx-auto px-4 py-2">
    <div className="flex flex-col lg:flex-row items-center justify-between gap-1 lg:gap-0">
      <div className="text-gray-400 text-center lg:text-left">
        <p className="text-xs">
          &copy; 2025 <span className="text-white font-medium">Tsaas.mn</span>
        </p>
      </div>
      
      <div className="flex flex-wrap justify-center lg:justify-end gap-2 text-xs">
        <a href="#" className="text-gray-400 hover:text-white">Нууцлалын бодлого</a>
        <a href="#" className="text-gray-400 hover:text-white">Үйлчилгээний нөхцөл</a>
        <a href="#" className="text-gray-400 hover:text-white">Төлбөрийн нөхцөл</a>
      </div>
    </div>
  </div>
</div>
    </footer>
  );
};

export default Footer;