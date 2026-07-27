require('dotenv').config();
const mongoose = require('mongoose');
const { XMLParser } = require('fast-xml-parser');
const connectDB = require('../config/database');
const { Category, Product } = require('../models');

// ─── Raw XML feed ────────────────────────────────────────────────────────────
const FEED_XML = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Lijustore - Product Feed</title>
    <link>https://lijustore.co.ke</link>
    <description>Google Merchant product feed for Lijustore Kenya — home appliances, electronics, furniture, and more.</description>

    <item>
      <g:id>1</g:id>
      <g:title>Multifunctional Vehicle Inverter 12/24V</g:title>
      <g:description>Multifunctional 12/24V vehicle inverter for reliable power on the go.</g:description>
      <g:link>https://lijustore.co.ke/product/1</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260311_111103.jpg</g:image_link>
      <g:price>3499.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Vehicles &amp; Parts &gt; Automotive Parts &amp; Accessories &gt; Automotive Accessories</g:google_product_category>
    </item>

    <item>
      <g:id>3</g:id>
      <g:title>Signature Electric Crepe and Chapati Maker</g:title>
      <g:description>Electric crepe and chapati maker for quick, even cooking.</g:description>
      <g:link>https://lijustore.co.ke/product/3</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260311_172634.jpg</g:image_link>
      <g:price>3499.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Signature</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Kitchen Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>5</g:id>
      <g:title>Smart Pro 2-in-1 Blender</g:title>
      <g:description>Smart Pro 2-in-1 blender for everyday blending needs.</g:description>
      <g:link>https://lijustore.co.ke/product/5</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260408_112058.jpg</g:image_link>
      <g:price>2199.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Smart Pro</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Kitchen Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>7</g:id>
      <g:title>Ipcone 2-in-1 Blender</g:title>
      <g:description>Ipcone 2-in-1 blender for smooth blending and daily kitchen prep.</g:description>
      <g:link>https://lijustore.co.ke/product/7</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260408_113830.jpg</g:image_link>
      <g:price>2099.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Ipcone</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Kitchen Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>9</g:id>
      <g:title>Premier 20L Knapsack Sprayer</g:title>
      <g:description>Premier 20L knapsack sprayer for garden, farm, and outdoor use.</g:description>
      <g:link>https://lijustore.co.ke/product/9</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260416_101925.jpg</g:image_link>
      <g:price>1999.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Premier</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Lawn &amp; Garden &gt; Garden Tools</g:google_product_category>
    </item>

    <item>
      <g:id>10</g:id>
      <g:title>Office Chair Without Headrest</g:title>
      <g:description>Comfortable office chair without headrest for home or workplace use.</g:description>
      <g:link>https://lijustore.co.ke/product/10</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260417_102226.jpg</g:image_link>
      <g:price>3799.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Office Supplies &gt; Office Equipment</g:google_product_category>
    </item>

    <item>
      <g:id>11</g:id>
      <g:title>Bosch 10-Piece Cookware Set</g:title>
      <g:description>Bosch 10-piece cookware set for reliable everyday cooking.</g:description>
      <g:link>https://lijustore.co.ke/product/11</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260417_161008.jpg</g:image_link>
      <g:price>6999.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Bosch</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Kitchen Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>14</g:id>
      <g:title>Baofeng BF-888S Radio Call</g:title>
      <g:description>Baofeng BF-888S radio call handset sold per piece.</g:description>
      <g:link>https://lijustore.co.ke/product/14</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260420_122155.jpg</g:image_link>
      <g:price>1299.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Baofeng</g:brand>
      <g:google_product_category>Electronics &gt; Communications &gt; Telecommunications</g:google_product_category>
    </item>

    <item>
      <g:id>15</g:id>
      <g:title>58mm Bluetooth Thermal Receipt Mobile Printer</g:title>
      <g:description>Portable 58mm Bluetooth thermal receipt printer for mobile business use.</g:description>
      <g:link>https://lijustore.co.ke/product/15</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260421_161011.jpg</g:image_link>
      <g:price>3499.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Office Supplies &gt; Office Equipment</g:google_product_category>
    </item>

    <item>
      <g:id>17</g:id>
      <g:title>Jump Starter Kit with Digital Compressor</g:title>
      <g:description>Jump starter kit with digital compressor for emergency vehicle support.</g:description>
      <g:link>https://lijustore.co.ke/product/17</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260422_142502.jpg</g:image_link>
      <g:price>5999.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Vehicles &amp; Parts &gt; Automotive Parts &amp; Accessories &gt; Automotive Accessories</g:google_product_category>
    </item>

    <item>
      <g:id>19</g:id>
      <g:title>Triple Lens 4G Solar Powered Camera</g:title>
      <g:description>Triple lens 4G solar powered camera for outdoor surveillance.</g:description>
      <g:link>https://lijustore.co.ke/product/19</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260422_181306.jpg</g:image_link>
      <g:price>7499.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Electronics &gt; Security &amp; Surveillance</g:google_product_category>
    </item>

    <item>
      <g:id>21</g:id>
      <g:title>Edenberg 12-Piece Cookware Set</g:title>
      <g:description>Edenberg 12-piece cookware set for complete kitchen cooking needs.</g:description>
      <g:link>https://lijustore.co.ke/product/21</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260423_175912.jpg</g:image_link>
      <g:price>8999.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Edenberg</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Kitchen Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>23</g:id>
      <g:title>Triple Lens WiFi Solar Powered Camera</g:title>
      <g:description>Triple lens WiFi solar powered camera for home and business security.</g:description>
      <g:link>https://lijustore.co.ke/product/23</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260430_121709.jpg</g:image_link>
      <g:price>7499.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Electronics &gt; Security &amp; Surveillance</g:google_product_category>
    </item>

    <item>
      <g:id>24</g:id>
      <g:title>Kitchen Scale 10kg</g:title>
      <g:description>10kg kitchen scale for accurate weighing during food prep.</g:description>
      <g:link>https://lijustore.co.ke/product/24</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260430_155354.jpg</g:image_link>
      <g:price>799.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Kitchen Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>25</g:id>
      <g:title>Neelux 100W AC Flood Light</g:title>
      <g:description>Neelux 100W AC flood light for bright outdoor illumination.</g:description>
      <g:link>https://lijustore.co.ke/product/25</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260430_160913.jpg</g:image_link>
      <g:price>1499.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Neelux</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Lighting</g:google_product_category>
    </item>

    <item>
      <g:id>27</g:id>
      <g:title>Nunix 2-in-1 Blender</g:title>
      <g:description>Nunix 2-in-1 blender for everyday kitchen blending.</g:description>
      <g:link>https://lijustore.co.ke/product/27</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260430_161341.jpg</g:image_link>
      <g:price>2099.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Nunix</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Kitchen Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>29</g:id>
      <g:title>Bosch 6L Electric Pressure Cooker</g:title>
      <g:description>Bosch 6L electric pressure cooker for fast, convenient meals.</g:description>
      <g:link>https://lijustore.co.ke/product/29</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260430_161905.jpg</g:image_link>
      <g:price>4999.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Bosch</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Kitchen Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>31</g:id>
      <g:title>Signature 4-in-1 Blender</g:title>
      <g:description>Signature 4-in-1 blender for versatile kitchen preparation.</g:description>
      <g:link>https://lijustore.co.ke/product/31</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260430_180243.jpg</g:image_link>
      <g:price>4799.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Signature</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Kitchen Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>32</g:id>
      <g:title>58mm Mobile Thermal Receipt Printer</g:title>
      <g:description>58mm mobile thermal receipt printer for quick receipt printing.</g:description>
      <g:link>https://lijustore.co.ke/product/32</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260501_105328.jpg</g:image_link>
      <g:price>3499.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Office Supplies &gt; Office Equipment</g:google_product_category>
    </item>

    <item>
      <g:id>34</g:id>
      <g:title>Nduthi Style Kids Bike 16 Inch</g:title>
      <g:description>16-inch nduthi style kids bike for young riders.</g:description>
      <g:link>https://lijustore.co.ke/product/34</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260509_130926.jpg</g:image_link>
      <g:price>7499.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Sports &amp; Outdoors &gt; Cycling &gt; Bikes</g:google_product_category>
    </item>

    <item>
      <g:id>36</g:id>
      <g:title>Automatic Money Counting Machine</g:title>
      <g:description>Automatic bill counter for fast and accurate cash counting.</g:description>
      <g:link>https://lijustore.co.ke/product/36</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260509_175745.jpg</g:image_link>
      <g:price>9998.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Office Supplies &gt; Office Equipment</g:google_product_category>
    </item>

    <item>
      <g:id>37</g:id>
      <g:title>Lady Bird Kids Bicycle 16 Inch</g:title>
      <g:description>16-inch Lady Bird kids bicycle for comfortable riding.</g:description>
      <g:link>https://lijustore.co.ke/product/37</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260511_162916.jpg</g:image_link>
      <g:price>6499.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lady Bird</g:brand>
      <g:google_product_category>Sports &amp; Outdoors &gt; Cycling &gt; Bikes</g:google_product_category>
    </item>

    <item>
      <g:id>40</g:id>
      <g:title>Nunix 2-Burner Table Top Gas Cooker</g:title>
      <g:description>Nunix 2-burner table top gas cooker for compact cooking spaces.</g:description>
      <g:link>https://lijustore.co.ke/product/40</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260512_122039.jpg</g:image_link>
      <g:price>1999.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Nunix</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Kitchen Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>42</g:id>
      <g:title>GSM Landline Dual SIM Phone 6588</g:title>
      <g:description>GSM landline phone with dual SIM support, model 6588.</g:description>
      <g:link>https://lijustore.co.ke/product/42</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260514_105923.jpg</g:image_link>
      <g:price>2999.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Electronics &gt; Communications &gt; Telecommunications</g:google_product_category>
    </item>

    <item>
      <g:id>44</g:id>
      <g:title>Dual Lens 4G Solar Powered CCTV Camera</g:title>
      <g:description>Dual lens 4G solar powered CCTV camera for reliable surveillance.</g:description>
      <g:link>https://lijustore.co.ke/product/44</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260514_115725.jpg</g:image_link>
      <g:price>6499.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Electronics &gt; Security &amp; Surveillance</g:google_product_category>
    </item>

    <item>
      <g:id>46</g:id>
      <g:title>Ergonomic Office Chair Without Headrest</g:title>
      <g:description>Ergonomic office chair without headrest for comfortable work sessions.</g:description>
      <g:link>https://lijustore.co.ke/product/46</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260514_120806.jpg</g:image_link>
      <g:price>3999.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Office Supplies &gt; Office Equipment</g:google_product_category>
    </item>

    <item>
      <g:id>48</g:id>
      <g:title>Kids Piggy Bank</g:title>
      <g:description>Kids piggy bank for fun saving habits.</g:description>
      <g:link>https://lijustore.co.ke/product/48</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260515_113922.jpg</g:image_link>
      <g:price>1999.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Toys &amp; Games</g:google_product_category>
    </item>

    <item>
      <g:id>49</g:id>
      <g:title>Kids Piggy Bank</g:title>
      <g:description>Kids piggy bank for encouraging simple saving habits.</g:description>
      <g:link>https://lijustore.co.ke/product/49</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260515_114842.jpg</g:image_link>
      <g:price>2499.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Toys &amp; Games</g:google_product_category>
    </item>

    <item>
      <g:id>50</g:id>
      <g:title>Kids Piggy Bank</g:title>
      <g:description>Kids piggy bank for storing coins and small savings.</g:description>
      <g:link>https://lijustore.co.ke/product/50</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260515_115047.jpg</g:image_link>
      <g:price>2499.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Toys &amp; Games</g:google_product_category>
    </item>

    <item>
      <g:id>51</g:id>
      <g:title>Ailyons 1.8L Electric Cordless Kettle</g:title>
      <g:description>Ailyons 1.8L electric cordless kettle for quick boiling.</g:description>
      <g:link>https://lijustore.co.ke/product/51</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260520_121813.jpg</g:image_link>
      <g:price>1299.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Ailyons</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Kitchen Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>53</g:id>
      <g:title>Synix Steam Iron Box</g:title>
      <g:description>Synix steam iron box for neat, wrinkle-free clothes.</g:description>
      <g:link>https://lijustore.co.ke/product/53</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260521_141407.jpg</g:image_link>
      <g:price>2299.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Synix</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Household Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>55</g:id>
      <g:title>Nunix Dry Iron Box</g:title>
      <g:description>Nunix dry iron box for everyday ironing.</g:description>
      <g:link>https://lijustore.co.ke/product/55</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260521_142128.jpg</g:image_link>
      <g:price>999.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Nunix</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Household Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>57</g:id>
      <g:title>Ipcone Dry Iron Box</g:title>
      <g:description>Ipcone dry iron box for simple daily ironing.</g:description>
      <g:link>https://lijustore.co.ke/product/57</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260521_142549.jpg</g:image_link>
      <g:price>999.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Ipcone</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Household Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>59</g:id>
      <g:title>Ramtons RM/399 1.7L Electric Corded Kettle</g:title>
      <g:description>Ramtons RM/399 1.7L electric corded kettle for dependable boiling.</g:description>
      <g:link>https://lijustore.co.ke/product/59</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260521_142949.jpg</g:image_link>
      <g:price>1999.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Ramtons</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Kitchen Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>62</g:id>
      <g:title>Modio M93 Tablet</g:title>
      <g:description>Modio M93 tablet for entertainment, learning, and everyday use.</g:description>
      <g:link>https://lijustore.co.ke/product/62</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260522_114004.jpg</g:image_link>
      <g:price>12999.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Modio</g:brand>
      <g:google_product_category>Electronics</g:google_product_category>
    </item>

    <item>
      <g:id>63</g:id>
      <g:title>Fridge and TV Guard</g:title>
      <g:description>Fridge and TV guard for appliance power protection.</g:description>
      <g:link>https://lijustore.co.ke/product/63</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260525_123449.jpg</g:image_link>
      <g:price>899.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Electronics &gt; Electrical</g:google_product_category>
    </item>

    <item>
      <g:id>65</g:id>
      <g:title>Multifunctional Vehicle Inverter 12/24V</g:title>
      <g:description>Multifunctional 12/24V vehicle inverter for powering devices while travelling.</g:description>
      <g:link>https://lijustore.co.ke/product/65</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260525_143428.jpg</g:image_link>
      <g:price>3399.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Vehicles &amp; Parts &gt; Automotive Parts &amp; Accessories &gt; Automotive Accessories</g:google_product_category>
    </item>

    <item>
      <g:id>67</g:id>
      <g:title>Von 1.7L Corded Electric Kettle</g:title>
      <g:description>Von 1.7L corded electric kettle for fast water boiling.</g:description>
      <g:link>https://lijustore.co.ke/product/67</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260526_093538.jpg</g:image_link>
      <g:price>1999.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Von</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Kitchen Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>69</g:id>
      <g:title>Ailyons 1.7L Electric Cordless Kettle</g:title>
      <g:description>Ailyons 1.7L electric cordless kettle for convenient boiling.</g:description>
      <g:link>https://lijustore.co.ke/product/69</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260526_104933.jpg</g:image_link>
      <g:price>25999.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Ailyons</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Kitchen Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>71</g:id>
      <g:title>Silver Crest 2-in-1 Blender</g:title>
      <g:description>Silver Crest 2-in-1 blender for smooth blending and kitchen prep.</g:description>
      <g:link>https://lijustore.co.ke/product/71</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260526_105738.jpg</g:image_link>
      <g:price>2499.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Silver Crest</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Kitchen Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>73</g:id>
      <g:title>Multifunctional Jump Starter Kit with Compressor</g:title>
      <g:description>Multifunctional jump starter kit with compressor for vehicle emergencies.</g:description>
      <g:link>https://lijustore.co.ke/product/73</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/20260526_114736.jpg</g:image_link>
      <g:price>4499.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Vehicles &amp; Parts &gt; Automotive Parts &amp; Accessories &gt; Automotive Accessories</g:google_product_category>
    </item>

    <item>
      <g:id>76</g:id>
      <g:title>Ailyons 1.8L Cordless Electric Kettle</g:title>
      <g:description>Ailyons 1.8L cordless electric kettle for quick and convenient boiling.</g:description>
      <g:link>https://lijustore.co.ke/product/76</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/ailyons 1.8L fk03201.jpg</g:image_link>
      <g:price>2899.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Ailyons</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Kitchen &amp; Dining &gt; Kitchen Appliances</g:google_product_category>
    </item>

    <item>
      <g:id>78</g:id>
      <g:title>Hisense 10.5kg Front Load Washing Machine</g:title>
      <g:description>Hisense 10.5kg front load washing machine with steam technology that removes 99.9% of bacteria. Features ConnectLife smart connectivity for convenient laundry care.</g:description>
      <g:link>https://lijustore.co.ke/product/78</g:link>
      <g:image_link>https://lijustore.co.ke/Photos/Hisense 10.5kgs wash and spin front load machine.jpeg</g:image_link>
      <g:price>53000.00 KES</g:price>
      <g:availability>in_stock</g:availability>
      <g:condition>new</g:condition>
      <g:brand>Lijustore</g:brand>
      <g:google_product_category>Home &amp; Garden &gt; Household Appliances</g:google_product_category>
    </item>
  </channel>
</rss>`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extract base category name from Google's hierarchical category string */
const getBaseCategory = (googleCat) => {
  if (!googleCat) return 'General';
  const parts = googleCat.split(' > ');
  return parts[0].trim();
};

/** Generate a URL-safe slug from a string */
const toSlug = (str) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** Parse KES price string to a number */
const parsePrice = (priceStr) => {
  if (!priceStr) return 0;
  const num = parseFloat(priceStr.replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
};

// ─── Main ─────────────────────────────────────────────────────────────────────

const importFeed = async () => {
  try {
    await connectDB();
    console.log('Connected to database.\n');

    // 1. Parse XML
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      isArray: (name) => name === 'item',
    });
    const result = parser.parse(FEED_XML);
    const items = result.rss.channel.item;
    console.log(`Parsed ${items.length} items from feed.\n`);

    // 2. Build unique category list from the feed's google_product_category
    const categorySet = new Set();
    for (const item of items) {
      const catName = getBaseCategory(item['g:google_product_category']);
      categorySet.add(catName);
    }

    // Also add the original categories that are broad enough
    const allCategoryNames = [...categorySet];
    console.log(`Categories to create: ${allCategoryNames.join(', ')}\n`);

    // 3. Create categories (upsert by slug)
    const categoryMap = {}; // name -> _id
    for (const name of allCategoryNames) {
      const slug = toSlug(name);
      let cat = await Category.findOne({ slug });
      if (cat) {
        cat.name = name;
        await cat.save();
      } else {
        cat = await Category.create({ name, slug, description: `${name} products` });
      }
      categoryMap[name] = cat._id;
      console.log(`  ${cat ? 'Ready' : 'Created'} → ${name}`);
    }

    // 4. Clear old products & insert feed products
    await Product.deleteMany({});
    console.log('\nCleared existing products.\n');

    let created = 0;
    for (const item of items) {
      const id = item['g:id'];
      const title = item['g:title'];
      const description = item['g:description'];
      const imageLink = item['g:image_link'];
      const price = parsePrice(item['g:price']);
      const brand = item['g:brand'] || 'Lijustore';
      const googleCat = item['g:google_product_category'] || '';
      const catName = getBaseCategory(googleCat);
      const categoryId = categoryMap[catName] || null;
      const slug = toSlug(title) + '-' + id;

      await Product.create({
        name: title,
        slug,
        description,
        price,
        stock: 50, // default stock
        sku: `LIJ-${String(id).padStart(4, '0')}`,
        imageUrl: imageLink,
        images: [imageLink],
        categoryId,
        isActive: true,
        isFeatured: false,
        brand,
        googleProductCategory: googleCat,
        externalId: String(id),
      });

      created++;
      process.stdout.write(`  ✓ ${title}\n`);
    }

    console.log(`\n✅ Import complete! ${created} products created.`);
    process.exit(0);
  } catch (err) {
    console.error('Import failed:', err.message);
    process.exit(1);
  }
};

importFeed();
