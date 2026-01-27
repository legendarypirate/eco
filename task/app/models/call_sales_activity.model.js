module.exports = (sequelize, Sequelize) => {
  const CallSalesActivity = sequelize.define("call_sales_activity", {
    // 1️⃣ Үндсэн мэдээлэл
    sales_manager_id: {
      type: Sequelize.UUID,
      allowNull: false,
      comment: "Ямар борлуулалтын менежер залгасан"
    },
    customer_id: {
      type: Sequelize.UUID,
      allowNull: true,
      comment: "Харилцагч (байгаа бол)"
    },
    customer_name: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "Харилцагчийн нэр (шинэ бол)"
    },
    phone_number: {
      type: Sequelize.STRING,
      allowNull: false,
      comment: "Залгасан дугаар"
    },

    // 2️⃣ Залгалтын мэдээлэл
    call_type: {
      type: Sequelize.ENUM("outgoing", "incoming"),
      allowNull: false,
      defaultValue: "outgoing",
      comment: "outgoing / incoming"
    },
    call_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
      comment: "Залгасан огноо"
    },
    call_time: {
      type: Sequelize.TIME,
      allowNull: true,
      comment: "Залгасан цаг"
    },
    call_duration_sec: {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: "Үргэлжилсэн хугацаа (секунд)"
    },
    call_result: {
      type: Sequelize.ENUM("answered", "no_answer", "busy", "rejected"),
      allowNull: true,
      comment: "answered / no_answer / busy / rejected"
    },

    // 3️⃣ Борлуулалтын үр дүн
    interest_level: {
      type: Sequelize.ENUM("high", "medium", "low"),
      allowNull: true,
      comment: "high / medium / low"
    },
    sale_status: {
      type: Sequelize.ENUM("sold", "follow_up", "not_interested"),
      allowNull: true,
      comment: "sold / follow_up / not_interested"
    },
    product: {
      type: Sequelize.STRING,
      allowNull: true,
      comment: "POS цаасны төрөл (57mm, 80mm гэх мэт)"
    },
    quantity: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "Тоо ширхэг"
    },
    price_offer: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: "Санал болгосон үнэ"
    },
    sale_amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: true,
      comment: "Борлуулалтын дүн"
    },
    order_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: "Захиалга болсон бол"
    },

    // 4️⃣ Follow-up (маш чухал)
    next_call_date: {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: "Дараагийн залгалт хийх огноо"
    },
    next_action: {
      type: Sequelize.ENUM("call_back", "send_price", "meeting"),
      allowNull: true,
      comment: "call_back / send_price / meeting"
    },
    follow_up_status: {
      type: Sequelize.ENUM("pending", "done"),
      allowNull: true,
      defaultValue: "pending",
      comment: "pending / done"
    },

    // 5️⃣ Тэмдэглэл
    note: {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: "Ярьсан зүйл, нөхцөл"
    }
  }, {
    tableName: 'call_sales_activities',
    timestamps: true,
    underscored: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  });

  return CallSalesActivity;
};

